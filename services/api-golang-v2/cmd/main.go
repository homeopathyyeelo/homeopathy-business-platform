package main

import (
	"log"
	"os"
	"github.com/gin-gonic/gin"
)

func main() {
	r := gin.Default()
	
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status": "healthy",
			"service": "golang-v2",
		})
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "3005"
	}

	log.Printf("Golang v2 Server starting on port %s", port)
	log.Fatal(r.Run(":" + port))
}
