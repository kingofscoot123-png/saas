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
    const updateStageContent = () => {
      title.textContent = nextStage.title;
      description.textContent = nextStage.description;

      if (link) {
        link.textContent = nextStage.cta;
      }
    };
    const isMobile = window.matchMedia("(max-width: 900px)").matches;

    if (window.gsap && !isMobile) {
      gsap.killTweensOf(textTargets);
      gsap
        .timeline()
        .to(textTargets, {
          autoAlpha: 0,
          y: -12,
          duration: 0.18,
          stagger: 0.035,
          ease: "power2.out",
          onComplete: updateStageContent,
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
      updateStageContent();
    }
  };

  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);

    const isMobileRoadmap = window.matchMedia("(max-width: 900px)").matches;

    if (isMobileRoadmap) {
      let ticking = false;

      const updateMobileRoadmap = () => {
        ticking = false;

        const rect = section.getBoundingClientRect();
        const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
        const travel = rect.height + viewportHeight;
        const scrolled = viewportHeight - rect.top;
        const progress = Math.min(1, Math.max(0, scrolled / travel));
        const stageIndex = Math.min(stages.length - 1, Math.floor(progress * stages.length));

        setPathProgress(progress);
        setStage(stageIndex);
      };

      const requestMobileUpdate = () => {
        if (ticking) {
          return;
        }

        ticking = true;
        window.requestAnimationFrame(updateMobileRoadmap);
      };

      window.addEventListener("scroll", requestMobileUpdate, { passive: true });
      window.addEventListener("resize", requestMobileUpdate, { passive: true });
      updateMobileRoadmap();
      return;
    }

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
      end: () => "+=2800",
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

const initTiltCards = () => {
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    return;
  }

  const cards = document.querySelectorAll(
    ".pricing-preview-card, .price-card, .card, .included-list, .comparison-grid > *, .next-steps > *, .voice-demo-card"
  );

  cards.forEach((card) => {
    card.classList.add("tilt-card");

    const updateTilt = (event) => {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      const rotateX = (0.5 - y) * 7;
      const rotateY = (x - 0.5) * 7;

      card.style.setProperty("--tilt-x", `${rotateX.toFixed(2)}deg`);
      card.style.setProperty("--tilt-y", `${rotateY.toFixed(2)}deg`);
      card.style.setProperty("--glow-x", `${(x * 100).toFixed(1)}%`);
      card.style.setProperty("--glow-y", `${(y * 100).toFixed(1)}%`);
      card.classList.add("is-tilting");
    };

    const resetTilt = () => {
      card.style.setProperty("--tilt-x", "0deg");
      card.style.setProperty("--tilt-y", "0deg");
      card.classList.remove("is-tilting");
    };

    card.addEventListener("pointermove", updateTilt, { passive: true });
    card.addEventListener("pointerleave", resetTilt);
  });
};

const initVoiceDemo = () => {
  const card = document.querySelector(".voice-demo-card");
  const tabs = document.querySelectorAll(".voice-demo-tab");

  if (!card || !tabs.length) {
    return;
  }

  const channelLabel = card.querySelector(".voice-demo-channel-label");
  const timer = card.querySelector(".voice-demo-timer");
  const messages = card.querySelectorAll(".demo-message");
  const footerIntent = card.querySelector(".voice-demo-footer span");
  const footerStatus = card.querySelector(".voice-demo-footer strong");
  const demos = {
    call: {
      channel: "שיחה נכנסת",
      time: "00:12",
      messages: [
        "היי, אפשר לקבוע פגישה למחר?",
        "בטח. באיזו שעה יהיה לך הכי נוח?",
        "בסביבות 10:30.",
      ],
      intent: "זיהוי כוונה: תיאום פגישה",
      status: "CRM מסונכרן",
    },
    whatsapp: {
      channel: "שיחת WhatsApp",
      time: "מחובר",
      messages: [
        "היי, אתם עדיין פתוחים?",
        "הנציגים סיימו להיום, אבל אני כאן ואשמח לעזור.",
        "מעולה, אשמח לקבל הצעת מחיר.",
      ],
      intent: "זיהוי כוונה: ליד חדש",
      status: "פרטים נשמרו",
    },
  };
  let activeMode = "call";
  let autoSwitch;

  const renderDemo = (mode) => {
    const demo = demos[mode];

    if (!demo || mode === activeMode && card.dataset.demoReady === "true") {
      return;
    }

    activeMode = mode;
    card.dataset.demoActive = mode;
    card.dataset.demoReady = "true";
    messages.forEach((message) => message.classList.add("is-changing"));

    window.setTimeout(() => {
      channelLabel.textContent = demo.channel;
      timer.textContent = demo.time;
      footerIntent.textContent = demo.intent;
      footerStatus.textContent = demo.status;
      messages.forEach((message, index) => {
        message.textContent = demo.messages[index];
        message.classList.remove("is-changing");
      });
    }, 220);

    tabs.forEach((tab) => {
      const isActive = tab.dataset.demoMode === mode;
      tab.classList.toggle("is-active", isActive);
      tab.setAttribute("aria-selected", String(isActive));
    });
  };

  const restartAutoSwitch = () => {
    window.clearInterval(autoSwitch);
    autoSwitch = window.setInterval(() => {
      renderDemo(activeMode === "call" ? "whatsapp" : "call");
    }, 6500);
  };

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      renderDemo(tab.dataset.demoMode);
      restartAutoSwitch();
    });
  });

  card.dataset.demoReady = "true";
  restartAutoSwitch();
};

initTiltCards();
initVoiceDemo();

const FORMSPREE_ENDPOINT = "https://formspree.io/f/moeanejn";

const handleLeadSubmit = async (event) => {
  event.preventDefault();

  const form = event.currentTarget;
  const submitButton = form.querySelector('button[type="submit"]');
  const nameInput = form.querySelector('input[name="name"]');
  const emailInput = form.querySelector('input[type="email"]');
  const name = nameInput?.value.trim() || "";
  const email = emailInput?.value.trim() || "";

  if (!name || !email) {
    return;
  }

  const defaultLabel = submitButton?.textContent || "שלח";
  submitButton?.setAttribute("disabled", "true");

  if (submitButton) {
    submitButton.textContent = "שולח...";
  }

  try {
    const response = await fetch(FORMSPREE_ENDPOINT, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, email }),
    });

    if (!response.ok) {
      throw new Error("Formspree request failed");
    }

    const params = new URLSearchParams({ name });
    window.location.href = `./thanks.html?${params.toString()}`;
  } catch {
    if (submitButton) {
      submitButton.textContent = defaultLabel;
    }

    submitButton?.removeAttribute("disabled");
    window.alert("לא הצלחנו לשלוח את הפרטים. נסה שוב בעוד רגע.");
  }
};

document.querySelectorAll(".lead-form").forEach((form) => {
  form.addEventListener("submit", handleLeadSubmit);
});

const navToggle = document.querySelector(".nav-toggle");
const heroNav = document.querySelector("#hero-nav");

const setNavState = (isOpen) => {
  heroNav.classList.toggle("is-open", isOpen);
  document.body.classList.toggle("nav-open", isOpen);
  navToggle.setAttribute("aria-expanded", String(isOpen));
  navToggle.setAttribute("aria-label", isOpen ? "סגור תפריט" : "פתח תפריט");
};

if (navToggle && heroNav) {
  navToggle.addEventListener("click", () => {
    setNavState(!heroNav.classList.contains("is-open"));
  });

  heroNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      setNavState(false);
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && heroNav.classList.contains("is-open")) {
      setNavState(false);
    }
  });
}

const siteHeader = document.querySelector("#site-header");

if (siteHeader) {
  const onScroll = () => {
    siteHeader.classList.toggle("is-scrolled", window.scrollY > 8);
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

const initCompareToggle = () => {
  const card = document.querySelector(".compare-card");

  if (!card) {
    return;
  }

  const buttons = card.querySelectorAll(".compare-toggle-btn");
  const thumb = card.querySelector(".compare-toggle-thumb");
  const stage = card.querySelector(".compare-stage");

  const setMode = (mode, activeButton) => {
    card.dataset.mode = mode;

    if (stage) {
      stage.dataset.compareActive = mode;
    }

    buttons.forEach((button) => {
      const isActive = button === activeButton;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-selected", String(isActive));
    });

    if (thumb && activeButton) {
      const first = buttons[0].getBoundingClientRect();
      const target = activeButton.getBoundingClientRect();
      thumb.style.transform = `translateX(${target.left - first.left}px)`;
    }
  };

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      setMode(button.dataset.compare, button);
    });
  });

  const initial = card.querySelector(".compare-toggle-btn.is-active") || buttons[0];
  setMode(initial.dataset.compare, initial);
  window.addEventListener("resize", () => {
    const active = card.querySelector(".compare-toggle-btn.is-active") || buttons[0];
    setMode(active.dataset.compare, active);
  });
};

const initFaqAccordion = () => {
  const items = document.querySelectorAll(".faq-item");

  if (!items.length) {
    return;
  }

  const setAnswerHeight = (item) => {
    const answer = item.querySelector(".faq-answer");

    if (!answer) {
      return;
    }

    if (item.hasAttribute("open")) {
      answer.style.maxHeight = `${answer.scrollHeight}px`;
    } else {
      if (answer.style.maxHeight === "none" || answer.style.maxHeight === "") {
        answer.style.maxHeight = `${answer.scrollHeight}px`;
      }
      requestAnimationFrame(() => {
        answer.style.maxHeight = "0px";
      });
    }
  };

  items.forEach((item) => {
    const summary = item.querySelector("summary");
    const answer = item.querySelector(".faq-answer");

    summary.addEventListener("click", (event) => {
      event.preventDefault();
      const willOpen = !item.hasAttribute("open");

      items.forEach((other) => {
        if (other !== item) {
          other.removeAttribute("open");
          setAnswerHeight(other);
        }
      });

      if (willOpen) {
        item.setAttribute("open", "");
      } else {
        item.removeAttribute("open");
      }

      setAnswerHeight(item);
    });

    if (answer) {
      answer.addEventListener("transitionend", () => {
        if (item.hasAttribute("open")) {
          answer.style.maxHeight = "none";
        }
      });
    }
  });

  window.addEventListener("resize", () => {
    items.forEach((item) => {
      if (item.hasAttribute("open")) {
        const answer = item.querySelector(".faq-answer");
        if (answer) {
          answer.style.maxHeight = "none";
        }
      }
    });
  });
};

initCompareToggle();
initFaqAccordion();

const thankYouHeading = document.querySelector(".thank-you h1");

if (thankYouHeading) {
  const params = new URLSearchParams(window.location.search);
  const name = params.get("name");

  if (name) {
    thankYouHeading.textContent = `תודה ${name}, קיבלנו את הפרטים שלך`;
  }
}
