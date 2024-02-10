package builder

import (
	"io"
	"log"
	"os"
	"path/filepath"
	"sync"

	"github.com/evanw/esbuild/pkg/api"
)

func copyDir(sourceDir, destDir string) error {
    // Open the source directory
    source, err := os.Open(sourceDir)
    if err != nil {
        return err
    }
    defer source.Close()

    // Create the destination directory if it doesn't exist
    if err := os.MkdirAll(destDir, 0755); err != nil {
        return err
    }

    // Read the contents of the source directory
    entries, err := source.Readdir(-1)
    if err != nil {
        return err
    }

    // Iterate over the entries in the source directory
    for _, entry := range entries {
        sourcePath := filepath.Join(sourceDir, entry.Name())
        destPath := filepath.Join(destDir, entry.Name())

        // If it's a directory, recursively call copyDir
        if entry.IsDir() {
            if err := copyDir(sourcePath, destPath); err != nil {
                return err
            }
        } else {
            // If it's a file, copy it to the destination directory
            if err := copyFile(sourcePath, destPath); err != nil {
                return err
            }
        }
    }

    return nil
}

func copyFile(sourceFile, destFile string) error {
    source, err := os.Open(sourceFile)
    if err != nil {
        return err
    }
    defer source.Close()

    destination, err := os.Create(destFile)
    if err != nil {
        return err
    }
    defer destination.Close()

    // Copy the contents of the file
    if _, err := io.Copy(destination, source); err != nil {
        return err
    }

    return nil
}


func BuildClient(events chan struct{}) {
	go copyDir("./viteApp/public", "./build/client")

	context, err := api.Context(api.BuildOptions{
		Platform: api.PlatformBrowser,
		Plugins: []api.Plugin{
			api.Plugin{
				Name: "reload",
				Setup: func(pb api.PluginBuild) {
					pb.OnEnd(func(result *api.BuildResult) (api.OnEndResult, error) {
						events <- struct{}{}
						return api.OnEndResult{}, nil
					})
				},
			},
		},
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

	if err != nil {
		log.Fatal(err)
	}

	err2 := context.Watch(api.WatchOptions{})

	if err2 != nil {
		log.Fatal(err2)
	}
	// fmt.Printf("%d errors and %d warnings\n", len(result.Errors), len(result.Warnings))
	wg.Done()
}


func BuildServer(events chan struct{}) {
	context, err := api.Context(api.BuildOptions{
		Platform: api.PlatformBrowser,
		Bundle:   true,
		Loader: map[string]api.Loader{
			".svg":  api.LoaderBinary,
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

	if err != nil {
		log.Fatal(err)
	}

	err2 := context.Watch(api.WatchOptions{})

	if err2 != nil {
		log.Fatal(err2)
	}
	// fmt.Printf("%d errors and %d warnings\n", len(result.Errors), len(result.Warnings))
	wg.Done()
}

var wg = sync.WaitGroup{}

func Build(events chan struct{}) {
	wg.Add(2)
	go BuildClient(events)
	go BuildServer(events)
	wg.Wait()
}
