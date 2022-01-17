//Dependencies
const Puppeteer = require("puppeteer")
const Request = require("request")
const Fs = require("fs")

//Variables
const Self_Args = process.argv.slice(2)

var Self = {}
Self.links = []
Self.vulnlinks = []

//Functions
async function Get_Links(){
    const browser = await Puppeteer.launch({ headless: false, argvs: ["--no-sandbox", "--disable-setuid-sandbox"] })
    const page = await browser.newPage()

    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.97 Safari/537.36")
    await page.goto(`https://www.bing.com/search?q=${Self_Args[1]}`)

    const page_content = await page.content()

    if(page_content.indexOf("There are no results for") !== -1){
        console.log(" Something went wrong while gathering some links, please try again later.")
        await browser.close()
        process.exit()
    }

    var page_index = 1

    await page.waitForSelector("#b_results > li> h2 > a").catch(async()=>{
        console.log("Something went wrong while gathering some links, please try again later.")
        await browser.close()
        process.exit()
    })

    const links = await page.$$eval("#b_results > li> h2 > a", elems =>{
        return elems.map(elem => elem.getAttribute("href"))
    })

    for( i in links ){
        Self.links.push(links[i])
    }

    var stop = false
    page_index += 1

    Repeater()
    async function Repeater(){
        await page.click(`#b_results > li.b_pag > nav > ul > li:nth-of-type(${page_index}) > a`).catch(async()=>{
            stop = true
            console.log(`${Self.links.length} links has been gathered.`)
            await browser.close()
            L_SVC()
        })

        if(stop){
            return
        }
        
        await page.waitForSelector("#b_results > li> h2 > a")

        const links = await page.$$eval("#b_results > li> h2 > a", elems =>{
            return elems.map(elem => elem.getAttribute("href"))
        })
    
        for( i in links ){
            Self.links.push(links[i])
        }

        if(page_index > Self_Args[0]){
            console.log(`${Self.links.length} links has been gathered.`)
            await browser.close()
            L_SVC()
            return
        }
    
        page_index += 1

        Repeater()
        return
    }
}

function L_SVC(){
    if(!Self.links.length){
        console.log("No links found.")
        process.exit()
    }

    var link_index = 0

    Repeater()
    function Repeater(){
        Request(`${Self.links[link_index]}1'`, function(err, res, body){
            if(err){

                if(link_index === Self.links.length){
                    console.log(`${Self.vulnlinks.length} vulnerable links found.`)
                    D()
                    return
                }

                link_index += 1
                Repeater()
                return
            }

            if(body.indexOf("MySQL server error") !== -1 || body.indexOf("MySql Error") !== -1 || body.indexOf("error") !== -1 && body.indexOf("MySQL") !== -1 || body.indexOf("SQL") !== -1){
                if(Self.links[link_index].indexOf("stackoverflow.com/questions") !== -1){
                    console.log(`${Self.links[link_index]} is not vulnerable.`)
                    if(link_index === Self.links.length){
                        console.log(`${Self.vulnlinks.length} vulnerable links found.`)
                        D()
                        return
                    }
    
                    link_index += 1
                    Repeater()
                    return
                }

                console.log(`${Self.links[link_index]} is vulnerable.`)
                Self.vulnlinks.push(`${Self.links[link_index]}`)

                if(link_index === Self.links.length){
                    console.log(`${Self.vulnlinks.length} vulnerable links found.`)
                    D()
                    return
                }

                link_index += 1
                Repeater()
                return
            }else{
                console.log(`${Self.links[link_index]} is not vulnerable`)
                if(link_index == Self.links.length){
                    console.log(`${Self.vulnlinks.length} vulnerable links found.`)
                    D()
                    return
                }

                link_index += 1
                Repeater()
                return
            }
        })
    }
}

function D(){
    var links = []

    console.log("Saving the links that has been gathered.")
    const GL_Data = Fs.readFileSync("./database/gathered_links.txt", "utf8")

    for( i in Self.links ){
        links.push(Self.links[i])
    }

    if(!GL_Data.length){
        Fs.writeFileSync("./database/gathered_links.txt", links, "utf8")
    }else{
        Fs.writeFileSync("./database/gathered_links.txt", `${GL_Data}\n${links.join("\n")}`, "utf8")
    }

    console.log("Finished")
    process.exit()
}

//Main
if(!Self_Args.length){
    console.log("node index.js <max_page> <dork> <output>")
    process.exit()
}

if(!Self_Args[0]){
    console.log("max_page is invalid.")
    process.exit()
}

if(isNaN(Self_Args[0])){
    console.log("max_page is not a number.")
    process.exit()
}

if(!Self_Args[1]){
    console.log("dork is invalid.")
    process.exit()
}

if(!Self_Args[2]){
    console.log("output is invalid.")
    process.exit()
}

console.log("Gathering links, please wait.")
Get_Links()