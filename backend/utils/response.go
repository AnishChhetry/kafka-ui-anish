package utils

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func JSONSuccess(c *gin.Context, payload interface{}) {
	c.JSON(http.StatusOK, gin.H{"status": "success", "data": payload})
}

func JSONError(c *gin.Context, err error) {
	c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": err.Error()})
}
