package main

import "testing"

var html = NewRenderer().RenderHtml()

func test(t *testing.T) {
	if len(html) < 100 {
		t.Fail()
	}
}


func isBytesOk(t *testing.T) {
	byteToW := []byte(html)
	if len(byteToW) < 100 {
		t.Fail()
	}
}
