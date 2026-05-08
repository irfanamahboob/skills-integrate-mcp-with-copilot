document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  const userBtn = document.getElementById("user-btn");
  const userMenu = document.getElementById("user-menu");
  const loginBtn = document.getElementById("login-btn");
  const logoutBtn = document.getElementById("logout-btn");
  const userStatus = document.getElementById("user-status");
  const loginModal = document.getElementById("login-modal");
  const loginForm = document.getElementById("login-form");
  const loginMessage = document.getElementById("login-message");
  const closeBtn = document.querySelector(".close");
  const teacherOnlyNotice = document.getElementById("teacher-only-notice");
  const loginPrompt = document.getElementById("login-prompt");
  const promptLoginBtn = document.getElementById("prompt-login-btn");

  let isTeacher = false;

  // Toggle user menu
  userBtn.addEventListener("click", () => {
    userMenu.classList.toggle("hidden");
  });

  // Close user menu when clicking elsewhere
  document.addEventListener("click", (event) => {
    if (!event.target.closest(".user-section")) {
      userMenu.classList.add("hidden");
    }
  });

  // Open login modal
  loginBtn.addEventListener("click", () => {
    loginModal.classList.remove("hidden");
    userMenu.classList.add("hidden");
  });

  promptLoginBtn.addEventListener("click", () => {
    loginModal.classList.remove("hidden");
  });

  // Close modal
  closeBtn.addEventListener("click", () => {
    loginModal.classList.add("hidden");
    loginForm.reset();
    loginMessage.classList.add("hidden");
  });

  // Close modal when clicking outside
  window.addEventListener("click", (event) => {
    if (event.target === loginModal) {
      loginModal.classList.add("hidden");
      loginForm.reset();
      loginMessage.classList.add("hidden");
    }
  });

  // Handle login form submission
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    try {
      const response = await fetch("/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const result = await response.json();

      if (response.ok) {
        isTeacher = true;
        updateUIForTeacher();
        loginMessage.textContent = "Login successful!";
        loginMessage.className = "success";
        loginMessage.classList.remove("hidden");

        // Store session in sessionStorage
        sessionStorage.setItem("teacher_username", username);

        setTimeout(() => {
          loginModal.classList.add("hidden");
          loginForm.reset();
          loginMessage.classList.add("hidden");
        }, 1500);
      } else {
        loginMessage.textContent = result.detail || "Login failed";
        loginMessage.className = "error";
        loginMessage.classList.remove("hidden");
      }
    } catch (error) {
      loginMessage.textContent = "Failed to login. Please try again.";
      loginMessage.className = "error";
      loginMessage.classList.remove("hidden");
      console.error("Error logging in:", error);
    }
  });

  // Handle logout
  logoutBtn.addEventListener("click", async () => {
    try {
      await fetch("/logout", {
        method: "POST",
      });

      isTeacher = false;
      sessionStorage.removeItem("teacher_username");
      updateUIForStudent();
      userMenu.classList.add("hidden");
      messageDiv.textContent = "Logged out successfully";
      messageDiv.className = "info";
      messageDiv.classList.remove("hidden");

      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 3000);
    } catch (error) {
      console.error("Error logging out:", error);
    }
  });

  // Check current user session
  async function checkUserSession() {
    try {
      const response = await fetch("/user");
      const user = await response.json();

      if (user.username) {
        isTeacher = true;
        updateUIForTeacher(user.username);
      } else {
        isTeacher = false;
        updateUIForStudent();
      }
    } catch (error) {
      console.error("Error checking user session:", error);
      isTeacher = false;
      updateUIForStudent();
    }
  }

  // Update UI for teacher
  function updateUIForTeacher(username = null) {
    isTeacher = true;
    signupForm.classList.remove("hidden");
    loginPrompt.classList.add("hidden");
    teacherOnlyNotice.classList.remove("hidden");
    loginBtn.classList.add("hidden");
    logoutBtn.classList.remove("hidden");
    userStatus.textContent = username
      ? `Logged in as: ${username}`
      : "Logged in as teacher";

    // Show delete buttons on activity cards
    document.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.classList.remove("hidden");
    });
  }

  // Update UI for student
  function updateUIForStudent() {
    isTeacher = false;
    signupForm.classList.add("hidden");
    loginPrompt.classList.remove("hidden");
    teacherOnlyNotice.classList.add("hidden");
    loginBtn.classList.remove("hidden");
    logoutBtn.classList.add("hidden");
    userStatus.textContent = "Not logged in";

    // Hide delete buttons on activity cards
    document.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.classList.add("hidden");
    });
  }

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

        // Create participants HTML with delete icons (hidden by default for students)
        const participantsHTML =
          details.participants.length > 0
            ? `<div class="participants-section">
              <h5>Participants:</h5>
              <ul class="participants-list">
                ${details.participants
                  .map(
                    (email) =>
                      `<li><span class="participant-email">${email}</span><button class="delete-btn ${
                        isTeacher ? "" : "hidden"
                      }" data-activity="${name}" data-email="${email}">❌</button></li>`
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

      // Add event listeners to delete buttons
      document.querySelectorAll(".delete-btn").forEach((button) => {
        button.addEventListener("click", handleUnregister);
      });
    } catch (error) {
      activitiesList.innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle unregister functionality
  async function handleUnregister(event) {
    event.preventDefault();
    
    const button = event.target;
    const activity = button.getAttribute("data-activity");
    const email = button.getAttribute("data-email");

    if (!isTeacher) {
      messageDiv.textContent = "Only teachers can unregister students.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      return;
    }

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
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

    if (!isTeacher) {
      messageDiv.textContent = "Only teachers can register students.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      return;
    }

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
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
  checkUserSession();
  fetchActivities();
});
