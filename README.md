# Dante-practice-website

A simple search site, styled after a scholarly library front page. You search for any topic and read the full Wikipedia article on the same page.

Open `index.html` in a browser. There's no build step, and Wikipedia's API doesn't need a key.

- `index.html`: page layout (home page, results and article views)
- `style.css`: styling
- `subjects.js`: the subjects and the tag groups shown on each subject page (edit this to add or change tags)
- `app.js`: Wikipedia API calls and hash routing (`#/search/...`, `#/article/...`, `#/explore`, `#/subject/...`, `#/random`)
