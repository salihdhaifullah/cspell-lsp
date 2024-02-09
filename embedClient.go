package main

import (
	"embed"
	"io/fs"
	"log"
)

//go:embed all:viteApp/dist/client
var frontendDist embed.FS
//go:embed all:viteApp/dist/server
var serverDist embed.FS

func Embed() (fs.FS, fs.FS) {
	fsysFrontend, err := fs.Sub(frontendDist, "viteApp/dist/client")
	if err != nil {
		log.Fatal(err)
	}

	fsysServer, err := fs.Sub(serverDist, "viteApp/dist/server")

	if err != nil {
		log.Fatal(err)
	}

	return fsysFrontend, fsysServer
}
