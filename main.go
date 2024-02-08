package main

import (
	"fmt"
	"log"
	"os"

	"github.com/evanw/esbuild/pkg/api"
	"rogchap.com/v8go"
)

// //go:embed all:viteApp/dist/client
// var frontendDist embed.FS

// //go:embed all:viteApp/dist/server
// var serverDist embed.FS

func main() {
	// fsysFrontend, err := fs.Sub(frontendDist, "viteApp/dist/client")
	// if err != nil {
	// 	log.Fatal(err)
	// }
	// fsysServer, err := fs.Sub(serverDist, "viteApp/dist/server")
	// if err != nil {
	// 	log.Fatal(err)
	// }
	// renderer.RunBlocking(renderer.FrontendBuild{
	// 	FrontendDist: fsysFrontend,
	// 	ServerDist:   fsysServer,
	// })


	script := "export function add(a, b) { return a + b };"

	result := api.Transform(script, api.TransformOptions{
		Loader:     api.LoaderJS,
		Format:     api.FormatIIFE,
		GlobalName: "global",
	})

	os.Stdout.Write(result.Code)

	fmt.Printf("%d errors and %d warnings\n",
		len(result.Errors), len(result.Warnings))

	ctx := v8go.NewContext()
	ctx.RunScript(string(result.Code), "math.mjs")

	global, err := ctx.Global().Get("global")
	if err != nil {
		log.Fatal(err)
	}

	globalObj, err := global.AsObject()
	if err != nil {
		log.Fatal(err)
	}

	fmt.Println(globalObj.Get("add"))
}
