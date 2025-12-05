package automation

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/chromedp/chromedp"
)

// GMBBrowserAutomation handles browser-based GMB posting
type GMBBrowserAutomation struct {
	ctx    context.Context
	cancel context.CancelFunc
}

// NewGMBBrowserAutomation creates a new browser automation instance
func NewGMBBrowserAutomation() *GMBBrowserAutomation {
	opts := append(chromedp.DefaultExecAllocatorOptions[:],
		chromedp.Flag("headless", true),
		chromedp.Flag("disable-gpu", true),
		chromedp.Flag("no-sandbox", true),
		chromedp.Flag("disable-dev-shm-usage", true),
	)

	allocCtx, _ := chromedp.NewExecAllocator(context.Background(), opts...)
	ctx, cancel := chromedp.NewContext(allocCtx)

	// Initialize browser
	if err := chromedp.Run(ctx); err != nil {
		log.Printf("Failed to init browser: %v", err)
	}

	return &GMBBrowserAutomation{
		ctx:    ctx,
		cancel: cancel,
	}
}

// Close closes the browser
func (g *GMBBrowserAutomation) Close() {
	if g.cancel != nil {
		g.cancel()
	}
}

// CreatePost creates a GMB post via browser automation
func (g *GMBBrowserAutomation) CreatePost(email, password, title, content string) error {
	ctx, cancel := context.WithTimeout(g.ctx, 90*time.Second)
	defer cancel()

	var loginSuccess bool

	// Navigate to Google Business
	err := chromedp.Run(ctx,
		chromedp.Navigate("https://business.google.com"),
		chromedp.Sleep(3*time.Second),
		chromedp.EvaluateAsDevTools(`document.querySelector('[data-location-id]') !== null`, &loginSuccess),
	)
	if err != nil {
		return fmt.Errorf("navigation failed: %v", err)
	}

	// Login if needed
	if !loginSuccess {
		log.Println("🔑 Logging in to Google Business...")
		err = chromedp.Run(ctx,
			// Click sign in
			chromedp.Click(`a[href*="accounts.google.com"]`, chromedp.NodeVisible),
			chromedp.Sleep(2*time.Second),

			// Enter email
			chromedp.WaitVisible(`input[type="email"]`, chromedp.ByQuery),
			chromedp.SendKeys(`input[type="email"]`, email, chromedp.ByQuery),
			chromedp.Sleep(500*time.Millisecond),
			chromedp.Click(`#identifierNext`, chromedp.NodeVisible),
			chromedp.Sleep(3*time.Second),

			// Enter password
			chromedp.WaitVisible(`input[type="password"]`, chromedp.ByQuery),
			chromedp.SendKeys(`input[type="password"]`, password, chromedp.ByQuery),
			chromedp.Sleep(500*time.Millisecond),
			chromedp.Click(`#passwordNext`, chromedp.NodeVisible),
			chromedp.Sleep(5*time.Second),
		)
		if err != nil {
			return fmt.Errorf("login failed: %v", err)
		}
		log.Println("✅ Logged in successfully")
	}

	// Create post
	log.Println("📄 Creating post...")
	fullContent := content
	if title != "" {
		fullContent = title + "\n\n" + content
	}

	err = chromedp.Run(ctx,
		// Click create post
		chromedp.Click(`button[aria-label*="Create post"], div[role="button"]:has-text("Create post")`, chromedp.NodeVisible),
		chromedp.Sleep(2*time.Second),

		// Fill content
		chromedp.WaitVisible(`textarea, div[contenteditable="true"]`, chromedp.ByQuery),
		chromedp.SendKeys(`textarea, div[contenteditable="true"]`, fullContent, chromedp.ByQuery),
		chromedp.Sleep(1*time.Second),

		// Publish
		chromedp.Click(`button[aria-label*="Publish"], button:has-text("Publish")`, chromedp.NodeVisible),
		chromedp.Sleep(5*time.Second),
	)
	if err != nil {
		return fmt.Errorf("post creation failed: %v", err)
	}

	log.Println("✅ Post published successfully")
	return nil
}
