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

const initRoadmap = () => {
  const section = document.querySelector(".roadmap-section");
  const sticky = document.querySelector(".roadmap-sticky");
  const progressPaths = document.querySelectorAll(".roadmap-progress");
  const nodes = document.querySelectorAll(".roadmap-node");
  const title = document.querySelector(".roadmap-title");
  const description = document.querySelector(".roadmap-description");
  const link = document.querySelector(".roadmap-link");

  if (!section || !sticky || !progressPaths.length || !nodes.length || !title || !description) {
    return;
  }

  const stages = [
    {
      title: "אפיון שיחה",
      description: "ממפים את סוגי השיחות, שעות העומס והמידע שהבוט צריך לדעת לפני שהוא עונה.",
      cta: "התחל בדמו קצר",
    },
    {
      title: "חוויית קול",
      description: "מעצבים שיחה טבעית בעברית שמרגישה אנושית, מקומית ומהירה.",
      cta: "שמע דוגמה",
    },
    {
      title: "אוטומציה",
      description: "השיחה הופכת לליד, תיאום וסיכום CRM בלי עבודה ידנית.",
      cta: "ראה את התהליך",
    },
    {
      title: "עלייה לאוויר",
      description: "העוזר הקולי מתחיל לעבוד אחרי שעות הפעילות ולתפוס שיחות שהיו נאבדות.",
      cta: "הזמן דמו",
    },
  ];

  let activeStage = 0;

  progressPaths.forEach((path) => {
    const length = path.getTotalLength();
    path.style.strokeDasharray = length;
    path.style.strokeDashoffset = length;
  });

  const getActivePath = () => {
    const isMobile = window.matchMedia("(max-width: 900px)").matches;
    return document.querySelector(isMobile ? ".roadmap-svg-mobile .roadmap-progress" : ".roadmap-svg-desktop .roadmap-progress");
  };

  const setPathProgress = (progress) => {
    const path = getActivePath();

    if (!path) {
      return;
    }

    const length = path.getTotalLength();
    path.style.strokeDasharray = length;
    path.style.strokeDashoffset = length * (1 - progress);
  };

  const setStage = (index) => {
    if (index === activeStage) {
      return;
    }

    activeStage = index;

    nodes.forEach((node, nodeIndex) => {
      node.classList.toggle("is-active", nodeIndex <= index);
    });

    const nextStage = stages[index];
    const textTargets = [title, description, link].filter(Boolean);

    if (window.gsap) {
      gsap
        .timeline()
        .to(textTargets, {
          autoAlpha: 0,
          y: -12,
          duration: 0.18,
          stagger: 0.035,
          ease: "power2.out",
          onComplete: () => {
            title.textContent = nextStage.title;
            description.textContent = nextStage.description;

            if (link) {
              link.textContent = nextStage.cta;
            }
          },
        })
        .fromTo(
          textTargets,
          { autoAlpha: 0, y: 18 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.34,
            stagger: 0.07,
            ease: "power3.out",
          }
        );
    } else {
      title.textContent = nextStage.title;
      description.textContent = nextStage.description;

      if (link) {
        link.textContent = nextStage.cta;
      }
    }
  };

  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);

    gsap.to(".roadmap-ambient-one", {
      yPercent: 18,
      xPercent: -8,
      ease: "none",
      scrollTrigger: {
        trigger: section,
        start: "top bottom",
        end: "bottom top",
        scrub: true,
      },
    });

    gsap.to(".roadmap-ambient-two", {
      yPercent: -20,
      xPercent: 10,
      ease: "none",
      scrollTrigger: {
        trigger: section,
        start: "top bottom",
        end: "bottom top",
        scrub: true,
      },
    });

    const roadmapTrigger = ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: () => (window.matchMedia("(max-width: 900px)").matches ? "+=1500" : "+=2800"),
      pin: sticky,
      pinSpacing: true,
      scrub: 0.65,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onEnter: () => {
        section.classList.add("is-pinned");
      },
      onEnterBack: () => {
        section.classList.add("is-pinned");
      },
      onLeave: () => {
        section.classList.remove("is-pinned");
      },
      onLeaveBack: () => {
        section.classList.remove("is-pinned");
      },
      onUpdate: (self) => {
        const progress = self.progress;
        const stageIndex = Math.min(stages.length - 1, Math.floor(progress * stages.length));

        setPathProgress(progress);
        setStage(stageIndex);
      },
    });

    window.addEventListener("resize", () => {
      setPathProgress(roadmapTrigger.progress || 0);
      ScrollTrigger.refresh();
    });
  } else {
    setPathProgress(1);
    setStage(stages.length - 1);
  }
};

window.addEventListener("load", initRoadmap);

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
