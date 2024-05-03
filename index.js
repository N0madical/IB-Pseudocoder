let selpos = 0
let codebox = document.getElementById("input")
let output = document.getElementById("output")
let undoarr = []

let mouseX = 0
let dragtimeout
let lastsave = ""

codebox.value = localStorage.getItem("script")

recordHistory()
setTimeout(saveRepeat, 5000)

function recordHistory() {
    if(undoarr.length == 0) {
        if(codebox.value.length > 5) {
            undoarr = [codebox.value].concat(undoarr)
        }
    } else {
        if(Math.abs(codebox.value.length - undoarr[0].length) > 10) {
            undoarr = [codebox.value].concat(undoarr)
        }
    }
    if(undoarr.length > 10) {
        undoarr.pop()
    }

    updateNumbers()

    setTimeout(recordHistory, 5000)
}

function saveRepeat() {
    saveCode()
    setTimeout(saveRepeat, 15000)
}

function saveCode() {
    localStorage.setItem("script", codebox.value)
    lastsave = codebox.value
    document.getElementById("saveDate").textContent = "Saved Changes | ☁";
}

function undo() {
    if(undoarr.length > 1) {
        codebox.value = undoarr[1]
        undoarr.shift()
    }
}

function clearBox(box) {
    if (box == 1) {
        codebox.value = ""
        document.getElementById("lines").value = "0."
    } else {
        output.value = ""
    }
}

codebox.addEventListener("keyup", updateNumbers) 

function updateNumbers() {
    lines = (codebox.value.match(/\n/g) || []).length
    document.getElementById("lines").value = ""
    for(let i = 0; i < lines+1; i++) {
        document.getElementById("lines").value += `${i}.\n`
    }
}

codebox.addEventListener("keydown", function(event) {
    if(event.key == "Tab") {
        event.preventDefault()

        let selpos = codebox.selectionStart
        let firstchar = codebox.value.lastIndexOf('\n', codebox.selectionStart - 1) + 1
        if(event.shiftKey) {
            if(codebox.value.slice(firstchar, firstchar+2) == "  ") {
                codebox.value = codebox.value.slice(0, firstchar) + codebox.value.slice(firstchar+2)
                codebox.selectionStart = selpos - 2
                codebox.selectionEnd = selpos - 2
            }
        } else {
            codebox.value = codebox.value.slice(0, firstchar) + "  " + codebox.value.slice(firstchar)
            codebox.selectionStart = selpos + 2
            codebox.selectionEnd = selpos + 2
        }
    }

    if(codebox.value != lastsave) {
        document.getElementById("saveDate").textContent = "Saving Changes... | ☁";
    }
})

codebox.addEventListener("scroll", function(event) {
    document.getElementById("lines").scrollTop = codebox.scrollTop
})

document.getElementById("lines").addEventListener("scroll", function(event) {
    codebox.scrollTop = document.getElementById("lines").scrollTop
})

addEventListener("mousemove", function(event) {
    mouseX = event.clientX
})

function resize(event) {
    if(event) {
        event.preventDefault();
    }
    if (((mouseX-((window.innerWidth/2)*0.05))-30 > 200) && ((mouseX-((window.innerWidth/2)*-0.05))+32 < 1400)) {
        document.getElementById("resizer").style.left = `${mouseX}px`
        document.getElementById("runbutton").style.left = `${mouseX}px`
        document.getElementById("input").style.width = `${(mouseX-((window.innerWidth/2)*0.05))-35}px`
        document.getElementById("output").style.width = `${(window.innerWidth) - ((mouseX-((window.innerWidth/2)*-0.05))+37)}px`
    }
    dragtimeout = setTimeout(resize, 10)
}

document.getElementById("resizer").addEventListener("mousedown", resize)
addEventListener("mouseup", function() {clearTimeout(dragtimeout)})

function togglePsGuide() {
    if(document.getElementById("psGuide").style.display == "none") {
        document.getElementById("psGuide").style.display = "inherit"
    } else {
        document.getElementById("psGuide").style.display = "none"
    }
}

function toggleExamples() {
    if(document.getElementById("examples").style.display == "none") {
        document.getElementById("examples").style.display = "inherit"
    } else {
        document.getElementById("examples").style.display = "none"
    }
}

for(let i in exampleNames) {
    document.getElementById("exampleinsert").innerHTML += `<button class="exbutton" onclick="loadExample('${exampleNames[i]}')">${exampleNames[i]}</button>`
}



function interpret() {
    saveCode()
    
    nowdate = new Date()
    output.value = "Output at " + nowdate.getHours() + ":" + nowdate.getMinutes() + ":\n\n"
    let commands = codebox.value.split("\n")
    let script = ""
    for(let i = 0; i < commands.length; i++) {
        if (commands[i].includes("output ")) {
            commands[i] = replace(commands[i], "output ", "print(") + ");"
        }
        commands[i] = replace(commands[i], " NOT", " !")
        commands[i] = replace(commands[i], " OR ", " || ")
        commands[i] = replace(commands[i], " AND ", " && ")
        commands[i] = replace(commands[i], " <> ", " != ")
        commands[i] = replace(commands[i], " mod ", " % ")
        let trimmed = commands[i].trim()
        if (trimmed.slice(0,6) == "input ") {
            let name = commands[i].slice(commands[i].indexOf("input")+6)
            commands[i] = commands[i].slice(0,commands[i].indexOf("input")) + name + " = input('" + commands[i].slice(commands[i].indexOf("input")+6) + "');"
        }
        if (commands[i].includes("input ")) {
            let name = commands[i].slice(commands[i].indexOf("input")+6)
            commands[i] = commands[i].slice(0,commands[i].indexOf("input")) + "input('" + commands[i].slice(commands[i].indexOf("input")+6) + "');"
        }
        if (trimmed.slice(0,3) == "if ") {
            commands[i] = replace(commands[i], "then", "")
            commands[i] = replace(commands[i], " = ", " == ")
            commands[i] = replace(commands[i], "if ", "if(") + ") {"
        }
        if (trimmed.slice(0,6) == "end if" || trimmed.slice(0,8) == "end loop" || trimmed.slice(0,9) == "end while" || trimmed.slice(0,10) == "end method") {
            commands[i] = commands[i].slice(0,commands[i].indexOf("end")) + "};"
        }
        if (trimmed.slice(0,5) == "loop " && !trimmed.includes("while")) {
            let variable = searchBetween(commands[i], "loop ", " from")
            let start = searchBetween(commands[i], "from ", " to")
            let end = commands[i].slice(commands[i].indexOf("to ") + 3)
            commands[i] = `${" ".repeat(commands[i].indexOf("loop"))}for (${variable} = ${start}; ${variable} <= ${end}; ${variable}++) {`
        }
        if (trimmed.slice(0,10) == "loop while") {
            commands[i] = replace(commands[i], "loop while ", "while (") + ") {"
        }
        if (trimmed.slice(0,7) == "method ") {
            commands[i] = replace(commands[i], "method", "function") + " {"
        }
        if (trimmed.slice(0,4) == "else" && !commands[i].includes("if")) {
            commands[i] = commands[i].slice(0,commands[i].indexOf("else")) + "} else {"
        }
        if (trimmed.slice(0,7) == "else if") {
            commands[i] = replace(commands[i], "then", "")
            commands[i] = replace(commands[i], " = ", " == ")
            commands[i] = replace(commands[i], "else if ", "} else if(") + ") {"
        }
        script += commands[i] + "\n"
    }
    console.debug(script)
    try {
        eval(script)
    } catch (error) {
        console.error(error)
        console.info("Error line number: " + (error.lineNumber-1))
        let codesplit = codebox.value.split("\n")
        let psuedoline = (codesplit[error.lineNumber-1]) ? codesplit[error.lineNumber-1]:""
        let errormsg = (commands[error.lineNumber-1]) ? commands[error.lineNumber-1].trim():""
        print(error + "\n\nError on line: " + (error.lineNumber-1) + "\n--> " + psuedoline + "\n\nTranslated Javascript Code:\n--> " + errormsg + "\n\nCheck console for more info")// + "\n\n\nTranslated Script: \n---\n" + script)
    }
    
}

function print(...items) {
    let tempout = ""
    for (let i in items) {
        tempout += items[i]
    }
    output.value += tempout + "\n"
}

function replace(string, find, out) {
    if(string.includes(find)) {
        let temp = string.slice(0, string.indexOf(find)) + out + string.slice(string.indexOf(find) + find.length)
        while (temp.includes(find)) {
            temp = temp.slice(0, temp.indexOf(find)) + out + temp.slice(temp.indexOf(find) + find.length)
        }
        return temp
    } else {
        return string
    }
}

function searchBetween(string, prev, after) {
    let temp = string.slice(string.indexOf(prev) + prev.length)
    return temp.slice(0, temp.indexOf(after))
}

const Queue = function() {
    this.value = []
    this.enqueue = function(value) {
        this.value.push(value)
    }
    this.dequeue = function() {
        return this.value.shift()
    }
    this.isEmpty = function() {
        if(this.value.length == 0) {
            return true
        } else {
            return false
        }
    }
}

const Stack = function() {
    this.value = []
    this.push = function(value) {
        this.value.push(value)
    }
    this.pop = function() {
        return this.value.pop()
    }
    this.isEmpty = function() {
        if(this.value.length == 0) {
            return true
        } else {
            return false
        }
    }
}

const Collection = function() {
    this.value = []
    this.nextIndex = -1
    this.addItem = function(value) {
        this.value.push(value)
    }
    this.removeItem = function() {
        return this.value.pop()
    }
    this.getNext = function() {
        this.nextIndex += 1
        return this.value[this.nextIndex]
    }
    this.resetNext = function() {
        this.nextIndex = -1
    }
    this.hasNext = function() {
        if(this.nextIndex+1 < this.value.length) {
            return true
        } else {
            return false
        }
    }
    this.isEmpty = function() {
        if(this.value.length == 0) {
            return true
        } else {
            return false
        }
    }
}

function input(text) {
    prompted = prompt(text)
    print("Prompted input '" + text + "' --> " + prompted)
    return prompted
}