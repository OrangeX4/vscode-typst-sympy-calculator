// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode')

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

const os = require('os')
const platform = os.platform()
let py
let is_init = false

/**
 * @param {vscode.ExtensionContext} context
*/
function activate(context) {
    const { exec, spawn } = require('child_process')
    const http = require('http')

    const port = 7396

    let python_path = ''

    switch (platform) {
        case 'darwin':
            python_path = vscode.workspace.getConfiguration('latex-sympy-calculator').get('macos')
            break;
        case 'linux':
            python_path = vscode.workspace.getConfiguration('latex-sympy-calculator').get('linux')
            break;
        case 'win32':
            python_path = vscode.workspace.getConfiguration('latex-sympy-calculator').get('windows')
            break;
        default:
            vscode.window.showErrorMessage('Unknown operate system.')
            return
    }

    // run auto update
    exec(python_path + ' -m pip install --upgrade typst-sympy-calculator', (err, stdout, stderr) => {
        
        if (err) {
            console.log(err)
        }
        
        if (stderr) {
            console.log(stderr)
        }
        
        if (stdout) {
            console.log(stdout)
        }
    })
    
    // run server
    py = spawn(python_path, [context.asAbsolutePath("server.py")])

    py.on('error', (err) => {
        console.log(err)
        vscode.window.showErrorMessage('Running python failed... Please read the guide and make sure you have install "python", "typst-sympy-calculator" and "Flask"')
    })

    py.on('exit', (code) => {
        console.log(`Exit Code: ${code}`)
        vscode.window.showErrorMessage('Running python failed... Please make sure you have "typst-sympy-calculator >= 0.4.2" and "Flask"')
        vscode.window.showErrorMessage('You can update it by "pip install --upgrade typst-sympy-calculator" and reboot your computer')
    })

    function base64(s) {
        return Buffer.from(s).toString('base64')
    }


    /**
     * @param {string} data
     * @param {string} path
     * @param {function} onSuccess
     * @param {function} onError
     */
    function post(data, path, onSuccess, onError) {
        for (let key in data) {
            if (typeof data[key] === 'string') {
                data[key] = base64(data[key])
            }
        }
        const _data = JSON.stringify(data)

        const options = {
            hostname: '127.0.0.1',
            port: port,
            path: path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': _data.length
            }
        }

        const req = http.request(options, res => {
            res.on('data', data => {
                const result = JSON.parse(data)
                if (result.error) {
                    onError(result.error)
                } else {
                    onSuccess(result.data)
                }
            })
        })

        req.on('error', () => {
            vscode.window.showInformationMessage('Activating the server...\nPlease retry for a moment later.')
        })

        req.write(_data)
        req.end()
    }

    /**
     * @param {string} path
     * @param {function} onSuccess
     */
    function get(path, onSuccess, onError) {
        const options = {
            hostname: '127.0.0.1',
            port: port,
            path: path,
            method: 'GET'
        }

        const req = http.request(options, res => {
            res.on('data', data => {
                const result = JSON.parse(data)
                if (result.error) {
                    onError(result.error)
                } else {
                    onSuccess(result.data)
                }
            })
        })

        req.on('error', () => {
            vscode.window.showInformationMessage('Activating the server...\r\nPlease retry for a moment later.')
        })
        
        req.end()
    }

    
    function init_if_not(typst_file, callback) {
        if (is_init) {
            callback()
        } else {
            post({ typst_file: typst_file }, '/init', (data) => {
                vscode.window.showInformationMessage('Import files: ' + JSON.stringify(data))
                is_init = true
                callback()
            }, (err) => {
                vscode.window.showErrorMessage(err)
            })
        }
    }


    context.subscriptions.push(
        vscode.commands.registerCommand('latex-sympy-calculator.equal', function () {
            let editor = vscode.window.activeTextEditor
            if (!editor) { return }
            let doc = editor.document
            let selection = editor.selection
            let typst_math = doc.getText(selection)
            let typst_file = doc.fileName

            init_if_not(typst_file, () => {
                post({
                    typst_math: typst_math,
                    typst_file: typst_file
                }, 'simplify', (data) => {
                    let editor = vscode.window.activeTextEditor
                    if (!editor) { return }
                    editor.edit((edit) => {
                        edit.insert(selection.end, ' = ' + data)
                    })
                }, (err) => {
                    vscode.window.showErrorMessage(err)
                })
            })
        })
    )

    context.subscriptions.push(
        vscode.commands.registerCommand('latex-sympy-calculator.numerical', function () {
            let editor = vscode.window.activeTextEditor
            if (!editor) { return }
            let doc = editor.document
            let selection = editor.selection
            let typst_math = doc.getText(selection)
            let typst_file = doc.fileName

            init_if_not(typst_file, () => {
                post({
                    typst_math: typst_math,
                    typst_file: typst_file
                }, 'evalf', (data) => {
                    let editor = vscode.window.activeTextEditor
                    if (!editor) { return }
                    editor.edit((edit) => {
                        edit.replace(selection, data)
                    })
                }, (err) => {
                    vscode.window.showErrorMessage(err)
                })
            })
        })
    )


    context.subscriptions.push(
        vscode.commands.registerCommand('latex-sympy-calculator.factor', function () {
            let editor = vscode.window.activeTextEditor
            if (!editor) { return }
            let doc = editor.document
            let selection = editor.selection
            let typst_math = doc.getText(selection)
            let typst_file = doc.fileName

            init_if_not(typst_file, () => {
                post({
                    typst_math: typst_math,
                    typst_file: typst_file
                }, 'factor', (data) => {
                    let editor = vscode.window.activeTextEditor
                    if (!editor) { return }
                    editor.edit((edit) => {
                        edit.replace(selection, data)
                    })
                }, (err) => {
                    vscode.window.showErrorMessage(err)
                })
            })
        })
    )


    context.subscriptions.push(
        vscode.commands.registerCommand('latex-sympy-calculator.expand', function () {
            let editor = vscode.window.activeTextEditor
            if (!editor) { return }
            let doc = editor.document
            let selection = editor.selection
            let typst_math = doc.getText(selection)
            let typst_file = doc.fileName

            init_if_not(typst_file, () => {
                post({
                    typst_math: typst_math,
                    typst_file: typst_file
                }, 'expand', (data) => {
                    let editor = vscode.window.activeTextEditor
                    if (!editor) { return }
                    editor.edit((edit) => {
                        edit.replace(selection, data)
                    })
                }, (err) => {
                    vscode.window.showErrorMessage(err)
                })
            })
        })
    )

    context.subscriptions.push(
        vscode.commands.registerCommand('latex-sympy-calculator.replace', function () {
            let editor = vscode.window.activeTextEditor
            if (!editor) { return }
            let doc = editor.document
            let selection = editor.selection
            let typst_math = doc.getText(selection)
            let typst_file = doc.fileName

            init_if_not(typst_file, () => {
                post({
                    typst_math: typst_math,
                    typst_file: typst_file
                }, 'simplify', (data) => {
                    let editor = vscode.window.activeTextEditor
                    if (!editor) { return }
                    editor.edit((edit) => {
                        edit.replace(selection, data)
                    })
                }, (err) => {
                    vscode.window.showErrorMessage(err)
                })
            })
        })
    )

    context.subscriptions.push(
        vscode.commands.registerCommand('latex-sympy-calculator.reimport', function () {
            let editor = vscode.window.activeTextEditor
            if (!editor) { return }
            let doc = editor.document
            let typst_file = doc.fileName
            post({ typst_file: typst_file }, '/init', (data) => {
                vscode.window.showInformationMessage('Import files: ' + JSON.stringify(data))
            }, (err) => {
                vscode.window.showErrorMessage(err)
            })
        })
    )

    context.subscriptions.push(
        vscode.commands.registerCommand('latex-sympy-calculator.variances', function () {
            get('/variances', (data) => {
                let editor = vscode.window.activeTextEditor
                if (!editor) { return }
                editor.edit((edit) => {
                    const result = '\r\n' + Object.keys(data).map((key) => key + ' = ' + data[key]).join('\r\n')
                    edit.insert(editor.selection.end, result)
                })
            }, (err) => {
                vscode.window.showErrorMessage(err)
            })
        })
    )


    context.subscriptions.push(
        vscode.commands.registerCommand('latex-sympy-calculator.python', function () {
            let editor = vscode.window.activeTextEditor
            if (!editor) { return }
            let doc = editor.document
            let selection = editor.selection
            let code = doc.getText(selection)

            post({code: code}, '/python', (data) => {
                let editor = vscode.window.activeTextEditor
                if (!editor) { return }
                editor.edit((edit) => {
                    edit.insert(selection.end, ' = ' + data)
                })
            }, (err) => {
                vscode.window.showErrorMessage(err)
            })
        })
    )
}

exports.activate = activate

// this method is called when your extension is deactivated
function deactivate() {
    py.kill()
}

module.exports = {
    activate,
    deactivate
}
