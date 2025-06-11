package models

type Topic struct {
	Name       string   `json:"name"`
	Partitions []int    `json:"partitions"`
	Replicas   []string `json:"replicas"`
}
