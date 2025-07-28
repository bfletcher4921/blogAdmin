// gets the json data from git
const DATA_URL = "https://raw.githubusercontent.com/bfletcher4921/devBlogData/main/blog-entries.json";

// fetch and display posts in the dom
fetch(DATA_URL)
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.text(); // get as text first to help debug json issues
  })
  .then(text => {
    console.log('Raw JSON response:', text); // log the raw respnse for debug
    try {
      const posts = JSON.parse(text);
      displayPosts(posts);
    } catch (jsonError) {
      throw new Error(`JSON parsing failed: ${jsonError.message}`);
    }
  })
  .catch(error => {
    console.error("Error fetching blog posts:", error);
    document.getElementById("post-list").innerHTML = `
      <div class="alert alert-danger">
        <h4>Failed to load blog posts</h4>
        <p><strong>Error:</strong> ${error.message}</p>
        <p><strong>Suggestion:</strong> Check the JSON file for syntax errors. Common issues:</p>
        <ul>
          <li>Missing commas between objects</li>
          <li>Line breaks in the middle of strings</li>
          <li>Unclosed quotes or brackets</li>
        </ul>
      </div>
    `;
  });

function displayPosts(posts) {
  const postList = document.getElementById("post-list");
  postList.innerHTML = ''; // clear any existing content

  if (!Array.isArray(posts) || posts.length === 0) {
    postList.innerHTML = '<p class="text-info">No blog posts found.</p>';
    return;
  }

  posts.forEach(post => {
    const postElement = document.createElement("div");
    postElement.className = "post p-3 mb-4 border rounded bg-white shadow-sm";

    postElement.innerHTML = `
      <h3>${post.title || 'Untitled'}</h3>
      <small class="text-muted">${post.date || 'No date'}</small>
      <p>${post.content || 'No content'}</p>
      <p><strong>Tags:</strong> ${post.tags ? post.tags.join(", ") : 'None'}</p>
      ${getReadMoreButton(post)}
    `;

    postList.appendChild(postElement);
  });
}

function getReadMoreButton(post) {
  // check if there is a target for the read button, if not a placeholder
  if (!post.link || !post.link.trim() || 
      post.link === "https://yourlink.com" || 
      post.link === "" || 
      post.link === "yourlink.com") {
    // no valid link - show a disabled message
    return `<small class="text-muted"><i class="bi bi-info-circle"></i> Full article coming soon</small>`;
  }
  
  // valid link - show the read more button
  return `<a href="${post.link}" target="_blank" class="btn btn-sm btn-outline-primary">
    <i class="bi bi-arrow-right"></i> Read more
  </a>`;
}

// add post form 
document.getElementById('new-post-form').addEventListener('submit', function(e) {
  e.preventDefault();
  const title = this.title.value;
  const content = this.content.value;
  const tags = this.tags.value.split(',').map(tag => tag.trim());

  const newPost = {
    title,
    date: new Date().toISOString().split('T')[0],
    content,
    tags
  };

  console.log('New Post:', newPost);
  alert('This post is not saved to the server (no backend), but here it is in the console.');
  this.reset();
});
