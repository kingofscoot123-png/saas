const revealElements = document.querySelectorAll(".reveal");

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.2 }
);

revealElements.forEach((element, index) => {
  element.style.transitionDelay = `${Math.min(index * 80, 320)}ms`;
  revealObserver.observe(element);
});

const typingElement = document.querySelector(".typing");

if (typingElement) {
  const text = typingElement.dataset.text || "";
  let index = 0;

  const type = () => {
    typingElement.textContent = text.slice(0, index);
    index += 1;

    if (index <= text.length) {
      window.setTimeout(type, 38);
    }
  };

  window.setTimeout(type, 900);
}

const form = document.querySelector(".lead-form");

if (form) {
  form.addEventListener("submit", (event) => {
    const emailInput = form.querySelector('input[type="email"]');
    const email = emailInput?.value.toLowerCase() || "";
    const blockedDomains = ["gmail.com", "yahoo.com"];
    const isBlocked = blockedDomains.some((domain) => email.endsWith(`@${domain}`));

    if (isBlocked) {
      event.preventDefault();
      emailInput.setCustomValidity("נראה שזה אימייל פרטי. כדאי להזין אימייל עסקי כדי שנוכל להתאים את הדמו.");
      emailInput.reportValidity();
      emailInput.style.borderColor = "#FF6B6B";
    } else {
      emailInput?.setCustomValidity("");
    }
  });
}
