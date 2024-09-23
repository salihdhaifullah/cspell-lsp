# cspell LSP wrapper

### To use with neovim 
1. Install using 
```bash 
npm i -g cspell-lsp-wrapper
```

2. Add this to setup the client for neovim
```lua
-- to reset the diagnostics used for `Add word to user setting command` 
-- to learn why, take a look at this open issue https://github.com/neovim/neovim/issues/30385

local function resetNSs(client_id)
    vim.validate({ client_id = { client_id, 'n' } })

    local client = vim.lsp.get_client_by_id(client_id)
    local server_id = vim.tbl_get((client or {}).server_capabilities, 'diagnosticProvider', 'identifier')

    local pull_ns_name = string.format('vim.lsp.%s.%d.%s', client and client.name or 'unknown', client_id,
        server_id or 'nil')
    local push_ns_name = string.format('vim.lsp.%s.%d', client and client.name or 'unknown', client_id)

    local pull_ns = vim.api.nvim_create_namespace(pull_ns_name)
    local push_ns = vim.api.nvim_create_namespace(push_ns_name)

    vim.diagnostic.reset(push_ns)
    vim.diagnostic.reset(pull_ns)
end


vim.api.nvim_create_autocmd('FileType', {
    pattern = {
        "markdown", "text", "plaintext", "md", "html", "xml", "json", "yaml", "toml", "javascript", "typescript",
        "javascriptreact", "typescriptreact", "css", "scss", "less", "vue", "svelte", "go", "python", "lua",
        "c", "cpp", "java", "php", "ruby", "rust", "bash", "sh", "dockerfile", "sql", "NvimTree"
    },
    callback = function()
        vim.lsp.start({
            name = "cspell",
            cmd = { "cspell-lsp-wrapper", "--stdio" },
            root_dir = vim.fn.getcwd(),
            init_options = {
                home = vim.fn.stdpath('config')
            },
            handlers = {
                ["textDocument/publishDiagnostics"] = function(_, result, ctx, config)
                    if #result.diagnostics == 0 then
                        resetNSs(ctx.client_id)
                    else
                        vim.lsp.diagnostic.on_publish_diagnostics(_, result, ctx, config)
                    end
                end
            }
        })
    end,
})
```
