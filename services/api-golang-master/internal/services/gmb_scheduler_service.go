package services

import (
	"fmt"
	"time"

	"github.com/yeelo/homeopathy-erp/internal/models"
	"gorm.io/gorm"
)

type GMBSchedulerService struct {
	DB         *gorm.DB
	gmbService *GMBService
	stopChan   chan struct{}
}

func NewGMBSchedulerService(db *gorm.DB, gmbService *GMBService) *GMBSchedulerService {
	return &GMBSchedulerService{
		DB:         db,
		gmbService: gmbService,
		stopChan:   make(chan struct{}),
	}
}

// Start begins the scheduler ticker
func (s *GMBSchedulerService) Start() {
	ticker := time.NewTicker(1 * time.Minute)
	go func() {
		for {
			select {
			case <-ticker.C:
				s.processScheduledPosts()
			case <-s.stopChan:
				ticker.Stop()
				return
			}
		}
	}()
	fmt.Println("GMB Scheduler Service started")
}

// Stop halts the scheduler
func (s *GMBSchedulerService) Stop() {
	close(s.stopChan)
}

// processScheduledPosts checks for due posts and publishes them
func (s *GMBSchedulerService) processScheduledPosts() {
	var duePosts []models.GMBScheduledPost
	now := time.Now()

	// Find posts that are scheduled for now or in the past and are still in SCHEDULED status
	err := s.DB.Preload("Account").Where("scheduled_time <= ? AND status = ?", now, "SCHEDULED").Find(&duePosts).Error
	if err != nil {
		fmt.Printf("Error fetching due posts: %v\n", err)
		return
	}

	for _, post := range duePosts {
		go s.publishScheduledPost(post)
	}
}

func (s *GMBSchedulerService) publishScheduledPost(post models.GMBScheduledPost) {
	fmt.Printf("Publishing scheduled post ID: %s\n", post.ID)

	// Update status to PUBLISHING to prevent double processing
	s.DB.Model(&post).Update("status", "PUBLISHING")

	// Use existing GMBService to publish
	// We need to construct a GMBPost model from the scheduled post
	gmbPost := &models.GMBPost{
		AccountID: post.GMBAccountID,
		Content:   post.Content,
		// Title is not in scheduled post, might need to extract or make optional
		Title: "Scheduled Post",
	}

	// Call the actual publishing logic (assuming PublishPost takes a post and account)
	// Note: GMBService.PublishPost might need refactoring to accept just the post if it handles account lookup internally,
	// or we pass the preloaded account.
	// For now, we'll simulate the call or adapt based on GMBService signature.
	// Checking GMBService signature from previous context... it seems to take (post *models.GMBPost, account *models.GMBAccount)

	err := s.gmbService.PublishPost(gmbPost, &post.Account)

	if err != nil {
		fmt.Printf("Failed to publish scheduled post %s: %v\n", post.ID, err)
		s.DB.Model(&post).Updates(map[string]interface{}{
			"status":     "FAILED",
			"updated_at": time.Now(),
		})
		return
	}

	// Success
	s.DB.Model(&post).Updates(map[string]interface{}{
		"status":     "PUBLISHED",
		"updated_at": time.Now(),
	})

	// Handle Recurrence
	if post.IsRecurring && post.RecurrencePattern != "" {
		s.scheduleNextRecurrence(post)
	}
}

func (s *GMBSchedulerService) scheduleNextRecurrence(post models.GMBScheduledPost) {
	var nextTime time.Time
	switch post.RecurrencePattern {
	case "DAILY":
		nextTime = post.ScheduledTime.AddDate(0, 0, 1)
	case "WEEKLY":
		nextTime = post.ScheduledTime.AddDate(0, 0, 7)
	case "MONTHLY":
		nextTime = post.ScheduledTime.AddDate(0, 1, 0)
	default:
		return
	}

	newPost := models.GMBScheduledPost{
		GMBAccountID:      post.GMBAccountID,
		Content:           post.Content,
		MediaURL:          post.MediaURL,
		ScheduledTime:     nextTime,
		IsRecurring:       true,
		RecurrencePattern: post.RecurrencePattern,
		Status:            "SCHEDULED",
		CreatedBy:         post.CreatedBy,
	}

	if err := s.DB.Create(&newPost).Error; err != nil {
		fmt.Printf("Failed to schedule next recurrence for post %s: %v\n", post.ID, err)
	} else {
		fmt.Printf("Scheduled next recurrence for post %s at %v\n", post.ID, nextTime)
	}
}
