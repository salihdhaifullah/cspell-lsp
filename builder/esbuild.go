package builder

import (
	"fmt"
	"log"
	"sync"

	"github.com/evanw/esbuild/pkg/api"
)


func BuildClient() {
	result := api.Build(api.BuildOptions{
		Platform: api.PlatformBrowser,
		Bundle:   true,
		Loader: map[string]api.Loader{
			".svg":  api.LoaderFile,
			".json": api.LoaderFile,
		},
		EntryPoints: []string{"./viteApp/src/entry-client.tsx"},
		Write:       true,
		Format:      api.FormatCommonJS,
		Outdir:      "./build/client",
		KeepNames: true,
		AssetNames: "[name]",
		ChunkNames: "[name]",
		Banner: map[string]string{
			"js": `
				function TextEncoder() {
				  this.encode = function encode(str) {
					var buf = new ArrayBuffer(str.length * 3);
					var bufView = new Uint8Array(buf);
					for (var i = 0, strLen = str.length; i < strLen; i++) {
					  var value = str.charCodeAt(i);
					  if (value < 128) {
						bufView[i] = value;
					  } else if (value < 2048) {
						bufView[i++] = 192 | (value >> 6);
						bufView[i] = 128 | (value & 63);
					  } else {
						bufView[i++] = 224 | (value >> 12);
						bufView[i++] = 128 | ((value >> 6) & 63);
						bufView[i] = 128 | (value & 63);
					  }
					}
					return bufView.slice(0, i);
				  };
				}`,
		},
	})

	if len(result.Errors) != 0 {
		log.Fatal(result.Errors[0])
	}

	fmt.Printf("%d errors and %d warnings\n", len(result.Errors), len(result.Warnings))
	wg.Done()
}


func BuildServer() {
	result := api.Build(api.BuildOptions{
		Platform: api.PlatformBrowser,
		Bundle:   true,
		Loader: map[string]api.Loader{
			".svg":  api.LoaderEmpty,
			".json": api.LoaderFile,
			".css": api.LoaderEmpty,
		},
		EntryPoints: []string{"./viteApp/script.ts"},
		Write:       true,
		Format:      api.FormatCommonJS,
		Outdir:      "./build/server",
		KeepNames: true,
		AssetNames: "[name]",
		ChunkNames: "[name]",
		Banner: map[string]string{
			"js": `
				function TextEncoder() {
				  this.encode = function encode(str) {
					var buf = new ArrayBuffer(str.length * 3);
					var bufView = new Uint8Array(buf);
					for (var i = 0, strLen = str.length; i < strLen; i++) {
					  var value = str.charCodeAt(i);
					  if (value < 128) {
						bufView[i] = value;
					  } else if (value < 2048) {
						bufView[i++] = 192 | (value >> 6);
						bufView[i] = 128 | (value & 63);
					  } else {
						bufView[i++] = 224 | (value >> 12);
						bufView[i++] = 128 | ((value >> 6) & 63);
						bufView[i] = 128 | (value & 63);
					  }
					}
					return bufView.slice(0, i);
				  };
				}`,
		},
	})

	if len(result.Errors) != 0 {
		log.Fatal(result.Errors[0])
	}

	fmt.Printf("%d errors and %d warnings\n", len(result.Errors), len(result.Warnings))
	wg.Done()
}

var wg = sync.WaitGroup{}

func Build() {
	wg.Add(2)
	go BuildClient()
	go BuildServer()
	wg.Wait()
}
