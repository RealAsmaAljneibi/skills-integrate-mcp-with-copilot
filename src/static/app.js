document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  
  // Authentication elements
  const userIcon = document.getElementById("user-icon");
  const userDropdown = document.getElementById("user-dropdown");
  const loginButton = document.getElementById("login-button");
  const logoutButton = document.getElementById("logout-button");
  const loginModal = document.getElementById("login-modal");
  const closeButton = document.querySelector(".close-button");
  const loginForm = document.getElementById("login-form");
  const loginMessage = document.getElementById("login-message");
  const loggedOutMenu = document.getElementById("logged-out-menu");
  const loggedInMenu = document.getElementById("logged-in-menu");
  const usernameDisplay = document.getElementById("username-display");
  
  // Authentication state
  let authToken = localStorage.getItem("authToken");
  let username = localStorage.getItem("username");
  
  // Update UI based on authentication state
  function updateAuthUI() {
    const isLoggedIn = !!authToken;
    
    if (isLoggedIn) {
      loggedOutMenu.classList.add("hidden");
      loggedInMenu.classList.remove("hidden");
      usernameDisplay.textContent = username;
      signupForm.parentElement.style.display = "block";
    } else {
      loggedOutMenu.classList.remove("hidden");
      loggedInMenu.classList.add("hidden");
      signupForm.parentElement.style.display = "none";
    }
  }
  
  // Toggle user dropdown
  userIcon.addEventListener("click", (e) => {
    e.stopPropagation();
    const wasHidden = userDropdown.classList.contains("hidden");
    userDropdown.classList.toggle("hidden");
    
    // If we just opened it, add the outside click listener after a short delay
    if (wasHidden) {
      setTimeout(() => {
        document.addEventListener("click", closeDropdownOnOutsideClick);
      }, 0);
    }
  });
  
  // Function to close dropdown when clicking outside
  function closeDropdownOnOutsideClick() {
    userDropdown.classList.add("hidden");
    document.removeEventListener("click", closeDropdownOnOutsideClick);
  }
  
  // Prevent dropdown from closing when clicking inside it
  userDropdown.addEventListener("click", (e) => {
    e.stopPropagation();
  });
  
  // Show login modal
  loginButton.addEventListener("click", () => {
    userDropdown.classList.add("hidden");
    loginModal.classList.remove("hidden");
  });
  
  // Close login modal
  closeButton.addEventListener("click", () => {
    loginModal.classList.add("hidden");
    loginForm.reset();
    loginMessage.classList.add("hidden");
  });
  
  // Close modal when clicking outside
  loginModal.addEventListener("click", (e) => {
    if (e.target === loginModal) {
      loginModal.classList.add("hidden");
      loginForm.reset();
      loginMessage.classList.add("hidden");
    }
  });
  
  // Handle login form submission
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const usernameInput = document.getElementById("username").value;
    const passwordInput = document.getElementById("password").value;
    
    try {
      const response = await fetch(
        `/login?username=${encodeURIComponent(usernameInput)}&password=${encodeURIComponent(passwordInput)}`,
        {
          method: "POST",
        }
      );
      
      const result = await response.json();
      
      if (response.ok) {
        authToken = result.token;
        username = result.username;
        localStorage.setItem("authToken", authToken);
        localStorage.setItem("username", username);
        
        loginMessage.textContent = "Login successful!";
        loginMessage.className = "success";
        loginMessage.classList.remove("hidden");
        
        setTimeout(() => {
          loginModal.classList.add("hidden");
          loginForm.reset();
          loginMessage.classList.add("hidden");
          updateAuthUI();
          fetchActivities();
        }, 1000);
      } else {
        loginMessage.textContent = result.detail || "Login failed";
        loginMessage.className = "error";
        loginMessage.classList.remove("hidden");
      }
    } catch (error) {
      loginMessage.textContent = "Login failed. Please try again.";
      loginMessage.className = "error";
      loginMessage.classList.remove("hidden");
      console.error("Error logging in:", error);
    }
  });
  
  // Handle logout
  logoutButton.addEventListener("click", async () => {
    try {
      await fetch("/logout", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
    } catch (error) {
      console.error("Error logging out:", error);
    }
    
    authToken = null;
    username = null;
    localStorage.removeItem("authToken");
    localStorage.removeItem("username");
    userDropdown.classList.add("hidden");
    updateAuthUI();
    fetchActivities();
  });

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft =
          details.max_participants - details.participants.length;

        // Create participants HTML with delete icons only if logged in
        const isLoggedIn = !!authToken;
        const participantsHTML =
          details.participants.length > 0
            ? `<div class="participants-section">
              <h5>Participants:</h5>
              <ul class="participants-list">
                ${details.participants
                  .map(
                    (email) =>
                      `<li><span class="participant-email">${email}</span>${isLoggedIn ? `<button class="delete-btn" data-activity="${name}" data-email="${email}">❌</button>` : ''}</li>`
                  )
                  .join("")}
              </ul>
            </div>`
            : `<p><em>No participants yet</em></p>`;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-container">
            ${participantsHTML}
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

      // Add event listeners to delete buttons (only if logged in)
      if (authToken) {
        document.querySelectorAll(".delete-btn").forEach((button) => {
          button.addEventListener("click", handleUnregister);
        });
      }
    } catch (error) {
      activitiesList.innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle unregister functionality
  async function handleUnregister(event) {
    const button = event.target;
    const activity = button.getAttribute("data-activity");
    const email = button.getAttribute("data-email");

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to unregister. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error unregistering:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  updateAuthUI();
  fetchActivities();
});
