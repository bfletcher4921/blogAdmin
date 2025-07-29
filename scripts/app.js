// gets the json data from git
const DATA_URL = "https://raw.githubusercontent.com/bfletcher4921/devBlogData/main/blog-entries.json";

// store posts globally so modal can access them
let allPosts = [];

// fetch and display posts in the dom
fetch(DATA_URL)
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.text();
  })
  .then(text => {
    console.log('Raw JSON response:', text);
    try {
      allPosts = JSON.parse(text);
      displayPosts(allPosts);
      // show success toast for successful data load
      showToast('info', 'Data Loaded', 'Blog posts loaded successfully from GitHub.');
    } catch (jsonError) {
      throw new Error(`JSON parsing failed: ${jsonError.message}`);
    }
  })
  .catch(error => {
    console.error("Error fetching blog posts:", error);
    allPosts = samplePosts;
    displayPosts(allPosts);
    
    // show error toast instead of inline error
    showToast('warning', 'Data Load Failed', 'Using sample data for demonstration.');
  });

// function to trim content for preview
function trimContent(content, wordLimit = 30) {
  if (!content) return 'No content available';
  
  const words = content.split(' ');
  if (words.length <= wordLimit) {
    return content;
  }
  
  return words.slice(0, wordLimit).join(' ') + '...';
}

function displayPosts(posts) {
  const postList = document.getElementById('post-list');
  const heading = postList.querySelector('h2');
  postList.innerHTML = '';
  if (heading) postList.appendChild(heading);

  if (posts.length === 0) {
    const noPostsMsg = document.createElement('p');
    noPostsMsg.textContent = 'No blog posts available.';
    noPostsMsg.className = 'text-muted';
    postList.appendChild(noPostsMsg);
    return;
  }

  posts.forEach(post => {
    const postElement = document.createElement('div');
    postElement.className = 'post-item';
    postElement.innerHTML = `
      <h3>${post.title || 'Untitled'}</h3>
      <div class="mb-2">
        <small class="text-muted">
          <i class="bi bi-calendar3"></i> ${post.date || 'No date'}
          ${post.author ? `<span class="mx-2">•</span><i class="bi bi-person"></i> ${post.author}` : ''}
        </small>
      </div>
      <p>${trimContent(post.content)}</p>
      <div class="mb-2">
        ${post.tags ? post.tags.map(tag => `<span class="badge bg-secondary me-1">${tag}</span>`).join('') : ''}
      </div>
      ${getReadMoreButton(post)}
    `;
    postList.appendChild(postElement);
  });
}

function getReadMoreButton(post) {
  // always show read more button for posts with content longer than preview
  const hasMoreContent = post.content && post.content.split(' ').length > 30;
  
  if (hasMoreContent) {
    // use data attributes instead of onclick for better reliability
    return `<button type="button" class="btn btn-sm btn-outline-primary read-more-btn" 
             data-bs-toggle="modal" 
             data-bs-target="#readMoreModal" 
             data-post-id="${post.id}" 
             data-post-title="${post.title}">
      <i class="bi bi-arrow-right"></i> Read more
    </button>`;
  }
  
  //check if this is explicitly marked as "coming soon" or draft 
  if (post.status === "draft" || post.status === "coming-soon" || post.comingSoon === true) {
    return `<small class="text-muted"><i class="bi bi-info-circle"></i> Full article coming soon</small>`;
  }
  
  return '';
}

// modal function to show full blog content
function loadModalContent(postId, title) {
  const post = allPosts.find(p => p.id == postId);
  
  if (!post) {
    document.getElementById('modalBody').innerHTML = `
      <div class="alert alert-warning">Post not found.</div>
    `;
    return;
  }

  document.getElementById('modalTitle').textContent = title || 'Blog Post';
  
  // display full post content in modal
  document.getElementById('modalBody').innerHTML = `
    <div class="blog-post-full">
      <div class="mb-3">
        <small class="text-muted">
          <i class="bi bi-calendar3"></i> ${post.date || 'No date'}
          ${post.author ? `<span class="mx-2">•</span><i class="bi bi-person"></i> ${post.author}` : ''}
        </small>
      </div>
      <div class="post-content">
        <p>${post.content || 'No content available'}</p>
      </div>
      <div class="mb-3">
        ${post.tags ? post.tags.map(tag => `<span class="badge bg-secondary me-1">${tag}</span>`).join('') : ''}
      </div>
      ${post.link && post.link.trim() && post.link !== "https://yourlink.com" ? 
        `<div class="mt-3">
          <a href="${post.link}" target="_blank" class="btn btn-outline-primary">
            <i class="bi bi-box-arrow-up-right"></i> View External Link
          </a>
        </div>` : ''}
    </div>
  `;
}

// add post form 
document.getElementById('new-post-form').addEventListener('submit', function(e) {
  e.preventDefault();
  const title = this.title.value;
  const author = this.author.value;
  const content = this.content.value;
  
  // add validation with toast feedback
  if (!title.trim()) {
    showToast('danger', 'Validation Error', 'Title is required.');
    return;
  }
  
  if (!author.trim()) {
    showToast('danger', 'Validation Error', 'Author is required.');
    return;
  }
  
  if (!content.trim()) {
    showToast('danger', 'Validation Error', 'Content is required.');
    return;
  }
  
  const tags = this.tags.value.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
  const link = this.link.value;
  const status = this.status.value;

  const newPost = {
    id: Date.now(),
    title,
    author,
    date: new Date().toISOString().split('T')[0],
    content,
    tags,
    link: link || "",
    status
  };
  //could not get gitapi to work to update blogdata file automatically ☹️ So, I added a manual thingy 
  // step 1: add to local post to display immediately
  allPosts.unshift(newPost);
  displayPosts(allPosts);

  // step 2: show manual save instructions
  showManualSaveInstructions(newPost, title);
  
  // step 3: reset form when done
  this.reset();
});

function showManualSaveInstructions(newPost, title) {
  const jsonOutput = JSON.stringify(newPost, null, 2);
  
  const alertDiv = document.createElement('div');
  alertDiv.className = 'alert alert-success alert-dismissible fade show';
  alertDiv.innerHTML = `
    <h5><i class="bi bi-check-circle"></i> Post Added Successfully!</h5>
    <p><strong>"${title}"</strong> has been added to the Blog Posts display. To save it permanently:</p>
    
    <div class="row">
      <div class="col-md-6">
        <h6>Steps to Save:</h6>
        <ol>
          <li>Copy the JSON below</li>
          <li>Click "Open GitHub File"</li>
          <li>Add JSON to beginning of array</li>
          <li>Commit changes</li>
        </ol>
        <a href="https://github.com/bfletcher4921/devBlogData/edit/main/blog-entries.json" 
           target="_blank" 
           class="btn btn-outline-primary">
          <i class="bi bi-github"></i> Open GitHub File
        </a>
      </div>
      
      <div class="col-md-6">
        <h6>Copy this JSON:</h6>
        <textarea class="form-control" rows="8" readonly onclick="this.select()" id="jsonOutput-${newPost.id}">${jsonOutput}</textarea>
        <button type="button" class="btn btn-sm btn-primary mt-2 copy-json-btn" data-json-id="${newPost.id}">
          <i class="bi bi-clipboard"></i> Copy to Clipboard
        </button>
      </div>
    </div>
    
    <div class="mt-3">
      <small class="text-muted">
        <i class="bi bi-info-circle"></i> The post appears in your admin blog posts display immediately. Manual save ensures it persists after page refresh.
      </small>
    </div>
    
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
  `;
  
  const form = document.getElementById('new-post-form');
  form.parentNode.insertBefore(alertDiv, form);
}

// copyToClipboard function
function copyToClipboard(text, button) {
  // try modern clipboard api first
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(() => {
      showCopySuccess(button);
    }).catch(() => {
      fallbackCopy(text, button);
    });
  } else {
    fallbackCopy(text, button);
  }
}

// backup copy method for old browsers or non-https
function fallbackCopy(text, button) {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.left = '-999999px';
  textArea.style.top = '-999999px';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  
  try {
    document.execCommand('copy');
    showCopySuccess(button);
  } catch (err) {
    console.error('Copy failed:', err);
    alert('Copy failed. Please select the text manually and copy with Ctrl+C');
  }
  
  document.body.removeChild(textArea);
}

// show copy success feedback
function showCopySuccess(button) {
  const originalText = button.innerHTML;
  button.innerHTML = '<i class="bi bi-check"></i> Copied!';
  button.classList.remove('btn-primary');
  button.classList.add('btn-success');
  
  setTimeout(() => {
    button.innerHTML = originalText;
    button.classList.remove('btn-success');
    button.classList.add('btn-primary');
  }, 2000);
}

// event listener for copy buttons
document.addEventListener('click', function(e) {
  if (e.target.closest('.copy-json-btn')) {
    const button = e.target.closest('.copy-json-btn');
    const jsonId = button.getAttribute('data-json-id');
    const textarea = document.getElementById(`jsonOutput-${jsonId}`);
    
    if (textarea) {
      const text = textarea.value;
      copyToClipboard(text, button);
    }
  }
});

// add event listener for read more buttons (add this after the existing code)
document.addEventListener('click', function(e) {
  if (e.target.closest('.read-more-btn')) {
    const button = e.target.closest('.read-more-btn');
    const postId = button.getAttribute('data-post-id');
    const title = button.getAttribute('data-post-title');
    loadModalContent(parseInt(postId), title);
  }
});


