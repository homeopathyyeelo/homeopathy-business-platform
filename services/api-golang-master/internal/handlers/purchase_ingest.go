package handlers

import (
	"bytes"
	"encoding/json"
	"io"
	"mime/multipart"
	"net/http"
	"net/url"

	"github.com/gin-gonic/gin"
	cfgpkg "github.com/yeelo/homeopathy-erp/internal/config"
)

type UploadResponse struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data"`
	Error   string      `json:"error"`
}

// POST /api/v1/purchases/invoices/upload
// Proxies multipart upload to invoice-parser-service and returns its response
func PurchasesUpload(c *gin.Context) {
	cfg := cfgpkg.Load()

	file, header, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "file is required"})
		return
	}
	defer file.Close()

	vendorID := c.PostForm("vendor_id")
	shopID := c.PostForm("shop_id")
	source := c.DefaultPostForm("source", "manual")

	var b bytes.Buffer
	w := multipart.NewWriter(&b)
	fw, err := w.CreateFormFile("file", header.Filename)
	if err != nil { c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()}); return }
	if _, err := io.Copy(fw, file); err != nil { c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()}); return }
	_ = w.WriteField("vendor_id", vendorID)
	_ = w.WriteField("shop_id", shopID)
	_ = w.WriteField("source", source)
	_ = w.WriteField("uploader_id", c.GetString("user_id"))
	w.Close()

	target, _ := url.JoinPath(cfg.InvoiceParserURL, "/api/v1/invoices/upload")
	req, err := http.NewRequest(http.MethodPost, target, &b)
	if err != nil { c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()}); return }
	req.Header.Set("Content-Type", w.FormDataContentType())
	// Forward auth if present
	if auth := c.GetHeader("Authorization"); auth != "" { req.Header.Set("Authorization", auth) }

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil { c.JSON(http.StatusBadGateway, gin.H{"error": err.Error()}); return }
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)

	if resp.StatusCode >= 300 {
		c.Data(resp.StatusCode, "application/json", body)
		return
	}

	var ur UploadResponse
	if err := json.Unmarshal(body, &ur); err != nil {
		// If parser returns plain JSON without wrapper, pass-through
		c.Data(http.StatusOK, "application/json", body)
		return
	}
	c.JSON(http.StatusAccepted, ur)
}
