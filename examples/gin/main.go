package main

import (
	"github.com/gin-gonic/gin"
)

func main() {
	r := gin.Default()
	r.GET("/", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "Welcome to Serverless Gin Application",
		})
	})
	r.Run(":9000") // listen and serve on 0.0.0.0:8080 (for windows "localhost:8080")
}