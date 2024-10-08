const { URL } = require("url")
const axios = require("axios")
const cheerio = require("cheerio")
const fs = require("fs")
const path = require("path")




const Sites = ["https://github.com/","https://aniwatchtv.to/"]
const links = []
const pageLimit = 10
let websiteName=""
let url=""

const AddBaseUrl=async(baseUrl)=>{

 url = new URL(baseUrl)
 websiteName = url.hostname
links.push(url.toString())
}
const pagesLinks = (text) => {
  text("a").each((index, element) => {
    let link = text(element).attr("href")
    if (link) {
      if (!link.startsWith("http")) {
        link = new URL(link, url).toString()
      }
      if (link.startsWith(url.origin) && link.split("/").length === 4) {
        links.push(link)
      }
    }
  })
}

const cleanText = (html) => {
  const $ = cheerio.load(html)
  let text = ""

  $("p, h1, h2, h3, h4, h5, h6").each((i, element) => {
    text += $(element).text() + "\n"
  })

  return text
}

const getPageNameFromUrl = (urlString) => {
  const urlObj = new URL(urlString)
  const pathParts = urlObj.pathname.split("/").filter((part) => part !== "") 
  return pathParts[pathParts.length - 1]
}

const Scrapper = async (url) => {
  try {
    AddBaseUrl(url)
    let pageCount = 0
    let visitedLinks = new Set()

    const websiteDir = path.join(__dirname, websiteName)
    if (!fs.existsSync(websiteDir)) {
      fs.mkdirSync(websiteDir)
    }

    while (pageCount < pageLimit) {
      if (links.length === 0) {
        break
      }

      const newLink = links.pop()
      if (!visitedLinks.has(newLink)) {
        visitedLinks.add(newLink)

        const response = await axios.get(newLink)
        const $ = cheerio.load(response.data)

        let pageText = cleanText(response.data)

        let pageName = getPageNameFromUrl(newLink)
        if (pageCount === 0) pageName = websiteName
        const filePath = path.join(websiteDir, `${pageName}.txt`)
        fs.writeFileSync(filePath, pageText, "utf8")

        pagesLinks($)

        pageCount++
      }
    }
  } catch (err) {
    console.error(err)
  }
}

const main = async () => {
  for (let site of Sites) {
    await Scrapper(site);
  }
};

main();
