const each = require('lodash/each')
const Promise = require('bluebird')
const path = require('path')
const Remarkable = require('remarkable').Remarkable
const prism = require('prismjs')
const loadLanguages = require('prismjs/components/');

const md = new Remarkable({
  langPrefix:   'language-',
  highlight: (str, lang) => {
    lang = lang.toLowerCase()
    if (lang && !prism.languages[lang]) {
      try {
        loadLanguages([lang])
      }
      catch (err) { }
    }
    if (lang && prism.languages[lang]) {
      try {
        return prism.highlight(str, prism.languages[lang], lang)
      } catch (err) {}
    }
 
    return '' // use external default escaping
  }
})


exports.onCreateNode = ({ node, actions }) => {
  const { createNodeField } = actions
  if (node.internal.type === 'CosmicjsPosts') {
    const html = md.render(node.metadata.content_markdown)
    createNodeField({node, name: 'content_markdown', value: html.replace('<pre>', '<pre class="language-">')})
  }
}


exports.createPages = ({ graphql, actions }) => {
  const { createPage } = actions
  const indexPage = path.resolve('./src/pages/index.js')
  createPage({
    path: `posts`,
    component: indexPage,
  })

  return new Promise((resolve, reject) => {
    const blogPost = path.resolve('./src/templates/blog-post.js')
    resolve(
      graphql(
        `
          {
            allCosmicjsPosts(sort: { fields: [created], order: DESC }, limit: 1000) {
              edges {
                node {
                  slug,
                  title
                }
              }
            }
          }
        `
      ).then(result => {
        if (result.errors) {
          console.log(result.errors)
          reject(result.errors)
        }

        // Create blog posts pages.
        const posts = result.data.allCosmicjsPosts.edges;

        each(posts, (post, index) => {
          const next = index === posts.length - 1 ? null : posts[index + 1].node;
          const previous = index === 0 ? null : posts[index - 1].node;

          createPage({
            path: `posts/${post.node.slug}`,
            component: blogPost,
            context: {
              slug: post.node.slug,
              previous,
              next,
            },
          })
        })
      })
    )
  })
}
