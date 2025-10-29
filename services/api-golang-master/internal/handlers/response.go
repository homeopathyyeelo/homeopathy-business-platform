package handlers

import (
	"net/http"
	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
)

// ==================== RESPONSE STRUCTURES ====================

type ErrorResponse struct {
	Success bool        `json:"success"`
	Error   string      `json:"error"`
	Code    string      `json:"code,omitempty"`
	Details interface{} `json:"details,omitempty"`
}

type SuccessResponse struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Message string      `json:"message,omitempty"`
	Meta    *MetaData   `json:"meta,omitempty"`
}

type MetaData struct {
	Page       int   `json:"page,omitempty"`
	Limit      int   `json:"limit,omitempty"`
	Total      int64 `json:"total,omitempty"`
	TotalPages int64 `json:"total_pages,omitempty"`
}

type ValidationError struct {
	Field   string `json:"field"`
	Message string `json:"message"`
}

// ==================== HELPER FUNCTIONS ====================

// RespondSuccess sends a successful response
func RespondSuccess(c *gin.Context, data interface{}) {
	c.JSON(http.StatusOK, SuccessResponse{
		Success: true,
		Data:    data,
	})
}

// RespondSuccessWithMessage sends a successful response with a message
func RespondSuccessWithMessage(c *gin.Context, data interface{}, message string) {
	c.JSON(http.StatusOK, SuccessResponse{
		Success: true,
		Data:    data,
		Message: message,
	})
}

// RespondCreated sends a 201 created response
func RespondCreated(c *gin.Context, data interface{}, message string) {
	c.JSON(http.StatusCreated, SuccessResponse{
		Success: true,
		Data:    data,
		Message: message,
	})
}

// RespondSuccessWithMeta sends a successful response with metadata (for pagination)
func RespondSuccessWithMeta(c *gin.Context, data interface{}, meta *MetaData) {
	c.JSON(http.StatusOK, SuccessResponse{
		Success: true,
		Data:    data,
		Meta:    meta,
	})
}

// RespondError sends an error response
func RespondError(c *gin.Context, statusCode int, err error) {
	c.JSON(statusCode, ErrorResponse{
		Success: false,
		Error:   err.Error(),
	})
}

// RespondErrorWithCode sends an error response with error code
func RespondErrorWithCode(c *gin.Context, statusCode int, code string, message string) {
	c.JSON(statusCode, ErrorResponse{
		Success: false,
		Error:   message,
		Code:    code,
	})
}

// RespondBadRequest sends a 400 bad request error
func RespondBadRequest(c *gin.Context, message string) {
	c.JSON(http.StatusBadRequest, ErrorResponse{
		Success: false,
		Error:   message,
		Code:    "BAD_REQUEST",
	})
}

// RespondUnauthorized sends a 401 unauthorized error
func RespondUnauthorized(c *gin.Context, message string) {
	c.JSON(http.StatusUnauthorized, ErrorResponse{
		Success: false,
		Error:   message,
		Code:    "UNAUTHORIZED",
	})
}

// RespondForbidden sends a 403 forbidden error
func RespondForbidden(c *gin.Context, message string) {
	c.JSON(http.StatusForbidden, ErrorResponse{
		Success: false,
		Error:   message,
		Code:    "FORBIDDEN",
	})
}

// RespondNotFound sends a 404 not found error
func RespondNotFound(c *gin.Context, resource string) {
	c.JSON(http.StatusNotFound, ErrorResponse{
		Success: false,
		Error:   resource + " not found",
		Code:    "NOT_FOUND",
	})
}

// RespondConflict sends a 409 conflict error
func RespondConflict(c *gin.Context, message string) {
	c.JSON(http.StatusConflict, ErrorResponse{
		Success: false,
		Error:   message,
		Code:    "CONFLICT",
	})
}

// RespondInternalError sends a 500 internal server error
func RespondInternalError(c *gin.Context, err error) {
	c.JSON(http.StatusInternalServerError, ErrorResponse{
		Success: false,
		Error:   "Internal server error",
		Code:    "INTERNAL_ERROR",
		Details: err.Error(),
	})
}

// RespondValidationError sends a 400 validation error with field details
func RespondValidationError(c *gin.Context, err error) {
	var validationErrors []ValidationError

	if validationErr, ok := err.(validator.ValidationErrors); ok {
		for _, fieldErr := range validationErr {
			validationErrors = append(validationErrors, ValidationError{
				Field:   fieldErr.Field(),
				Message: getValidationMessage(fieldErr),
			})
		}
	}

	c.JSON(http.StatusBadRequest, ErrorResponse{
		Success: false,
		Error:   "Validation failed",
		Code:    "VALIDATION_ERROR",
		Details: validationErrors,
	})
}

// getValidationMessage returns a human-readable validation error message
func getValidationMessage(fieldErr validator.FieldError) string {
	field := fieldErr.Field()
	tag := fieldErr.Tag()

	switch tag {
	case "required":
		return field + " is required"
	case "email":
		return field + " must be a valid email address"
	case "min":
		return field + " must be at least " + fieldErr.Param() + " characters"
	case "max":
		return field + " must be at most " + fieldErr.Param() + " characters"
	case "len":
		return field + " must be exactly " + fieldErr.Param() + " characters"
	case "gt":
		return field + " must be greater than " + fieldErr.Param()
	case "gte":
		return field + " must be greater than or equal to " + fieldErr.Param()
	case "lt":
		return field + " must be less than " + fieldErr.Param()
	case "lte":
		return field + " must be less than or equal to " + fieldErr.Param()
	case "numeric":
		return field + " must contain only numbers"
	case "alphanum":
		return field + " must contain only letters and numbers"
	case "uuid":
		return field + " must be a valid UUID"
	case "oneof":
		return field + " must be one of: " + fieldErr.Param()
	default:
		return field + " is invalid"
	}
}

// ==================== CONTEXT HELPERS ====================

// GetUserIDFromContext retrieves user ID from gin context
func GetUserIDFromContext(c *gin.Context) (string, bool) {
	userID, exists := c.Get("user_id")
	if !exists {
		return "", false
	}
	
	userIDStr, ok := userID.(string)
	return userIDStr, ok
}

// GetUserRoleFromContext retrieves user role from gin context
func GetUserRoleFromContext(c *gin.Context) (string, bool) {
	role, exists := c.Get("user_role")
	if !exists {
		return "", false
	}
	
	roleStr, ok := role.(string)
	return roleStr, ok
}
