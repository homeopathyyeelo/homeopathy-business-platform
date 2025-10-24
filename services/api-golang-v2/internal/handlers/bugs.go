package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/yeelo/homeopathy-erp/internal/services"
)

type BugHandler struct{ Service *services.BugService }

func NewBugHandler(s *services.BugService) *BugHandler { return &BugHandler{Service: s} }

// GET /api/v1/system/bugs?severity=&status=&service=&page=&size=
func (h *BugHandler) ListBugs(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	size, _ := strconv.Atoi(c.DefaultQuery("size", "20"))
	if size <= 0 { size = 20 }
	if page <= 0 { page = 1 }
	f := services.BugFilter{
		Severity: c.Query("severity"),
		Status:   c.Query("status"),
		Service:  c.Query("service"),
		Limit:    size,
		Offset:   (page-1)*size,
	}
	rows, total, err := h.Service.ListBugs(f)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"data": rows,
		"pagination": gin.H{"page": page, "size": size, "total": total},
	})
}

// GET /api/v1/system/bugs/:id
func (h *BugHandler) GetBug(c *gin.Context) {
	id := c.Param("id")
	row, err := h.Service.GetBug(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "bug not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": row})
}

// POST /api/v1/system/bugs/ingest
func (h *BugHandler) Ingest(c *gin.Context) {
	var dto services.IngestBugDTO
	if err := c.ShouldBindJSON(&dto); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	id, err := h.Service.IngestBug(dto)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusAccepted, gin.H{"bug_id": id})
}

// POST /api/v1/system/bugs/:id/approve
func (h *BugHandler) Approve(c *gin.Context) {
	id := c.Param("id")
	approver := c.GetString("user_id")
	if err := h.Service.ApproveBug(id, approver); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"approved": true})
}
