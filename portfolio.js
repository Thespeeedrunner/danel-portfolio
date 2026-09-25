const portfolioKey = 'savedPortfolios';
const activePortfolioKey = 'activePortfolioId';
const newPortfolioForm = document.querySelector('#new-portfolio-form');
const newPortfolioButton = document.querySelector('#new-portfolio-button');
const savedPortfoliosSelect = document.querySelector('#saved-portfolios');
const portfolioCount = document.querySelector('#portfolio-count');
const boxShapeSelect = document.querySelector('#box-shape');
const boxTypeSelect = document.querySelector('#box-type');
const editingColor = document.querySelector('#editing-color');
const addTextButton = document.querySelector('#add-text-button');
const addBoxButton = document.querySelector('#add-box-button');
const sidebarToggle = document.querySelector('#sidebar-toggle');
const portfolioSidebar = document.querySelector('#portfolio-sidebar');
const appearanceColor = document.querySelector('#portfolio-color');
const backgroundImageInput = document.querySelector('#background-image');
let portfolios = JSON.parse(localStorage.getItem(portfolioKey) || '[]');
let activePortfolioId = localStorage.getItem(activePortfolioKey);

const closeSidebar = () => {
  if (portfolioSidebar && sidebarToggle) {
    portfolioSidebar.classList.remove('is-open');
    document.body.classList.remove('sidebar-open');
    sidebarToggle.setAttribute('aria-expanded', 'false');
    sidebarToggle.setAttribute('aria-label', 'Open portfolio tools');
    sidebarToggle.classList.remove('is-open');
  }
};

if (sidebarToggle && portfolioSidebar) {
  sidebarToggle.addEventListener('click', () => {
    const isOpen = portfolioSidebar.classList.toggle('is-open');
    document.body.classList.toggle('sidebar-open', isOpen);
    sidebarToggle.setAttribute('aria-expanded', String(isOpen));
    sidebarToggle.setAttribute('aria-label', isOpen ? 'Close portfolio tools' : 'Open portfolio tools');
    sidebarToggle.classList.toggle('is-open', isOpen);
  });
}

const colorWithOpacity = (hex, opacity) => {
  const value = hex.replace('#', '');
  const red = parseInt(value.slice(0, 2), 16);
  const green = parseInt(value.slice(2, 4), 16);
  const blue = parseInt(value.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${opacity})`;
};

const colorWithLightness = (hex, amount) => {
  const value = hex.replace('#', '');
  const red = parseInt(value.slice(0, 2), 16);
  const green = parseInt(value.slice(2, 4), 16);
  const blue = parseInt(value.slice(4, 6), 16);
  const adjust = (channel) => Math.max(0, Math.min(255, channel + amount));
  return `rgb(${adjust(red)}, ${adjust(green)}, ${adjust(blue)})`;
};

const readableTextColor = (hex) => {
  const value = hex.replace('#', '');
  const red = parseInt(value.slice(0, 2), 16) / 255;
  const green = parseInt(value.slice(2, 4), 16) / 255;
  const blue = parseInt(value.slice(4, 6), 16) / 255;
  const luminance = 0.2126 * red + 0.7152 * green + 0.0722 * blue;
  return luminance < 0.52 ? '#ffffff' : '#111827';
};

const getEditorFields = () => [...document.querySelectorAll('[contenteditable]')];

const setEditorEnabled = (enabled) => {
  getEditorFields().forEach((editable) => {
    editable.setAttribute('contenteditable', String(enabled));
    editable.setAttribute('aria-disabled', String(!enabled));
  });

  document.querySelectorAll('.upload-box input[type="file"]').forEach((input) => {
    input.disabled = !enabled;
  });

  document.body.classList.toggle('editor-locked', !enabled);
  [boxShapeSelect, boxTypeSelect, editingColor, addTextButton, addBoxButton].forEach((control) => {
    if (control) {
      control.disabled = !enabled;
    }
  });
};

const applyAppearance = (settings = {}) => {
  const accentColor = settings.accentColor || '#0f766e';
  document.documentElement.style.setProperty('--accent-color', accentColor);
  document.documentElement.style.setProperty('--portfolio-text', readableTextColor(accentColor));
  document.documentElement.style.setProperty('--portfolio-surface', colorWithOpacity(accentColor, 0.25));
  document.documentElement.style.setProperty('--portfolio-surface-strong', colorWithOpacity(accentColor, 0.7));
  document.documentElement.style.setProperty('--flow-color-1', colorWithLightness(accentColor, 70));
  document.documentElement.style.setProperty('--flow-color-2', colorWithLightness(accentColor, 35));
  document.documentElement.style.setProperty('--flow-color-3', accentColor);
  document.documentElement.style.setProperty('--flow-color-4', colorWithLightness(accentColor, -35));

  if (appearanceColor) {
    appearanceColor.value = accentColor;
  }
  if (editingColor) {
    editingColor.value = accentColor;
  }

  document.body.style.backgroundImage = settings.backgroundImage
    ? `url("${settings.backgroundImage}")`
    : '';
  document.body.classList.toggle('custom-background', Boolean(settings.backgroundImage));
  document.documentElement.style.setProperty('--box-radius', settings.boxShape || '16px');
  if (boxTypeSelect) {
    boxTypeSelect.value = 'text';
  }
  if (boxShapeSelect) {
    boxShapeSelect.value = settings.boxShape || '16px';
  }
};

const savePortfolios = () => {
  localStorage.setItem(portfolioKey, JSON.stringify(portfolios));
};

const renderPortfolioPicker = () => {
  if (!savedPortfoliosSelect || !portfolioCount) {
    return;
  }

  portfolioCount.textContent = `${portfolios.length} portfolio${portfolios.length === 1 ? '' : 's'} saved`;
  savedPortfoliosSelect.replaceChildren(new Option('Choose a saved portfolio', ''));
  portfolios.forEach((portfolio) => {
    savedPortfoliosSelect.add(new Option(portfolio.name, portfolio.id));
  });
  savedPortfoliosSelect.value = activePortfolioId || '';
}

const saveActivePortfolio = () => {
  const portfolio = portfolios.find((item) => item.id === activePortfolioId);
  if (!portfolio) {
    return;
  }

  portfolio.content = getEditorFields().map((field) => field.textContent);
  portfolio.introTextCount = document.querySelectorAll('.intro [contenteditable]').length;
  portfolio.cardCount = document.querySelectorAll('.card').length;
  portfolio.cardTypes = [...document.querySelectorAll('.card')].map((card) => card.dataset.boxType || 'text');
  portfolio.media = [...document.querySelectorAll('.upload-box')].map((box) => {
    const media = box.querySelector('img, video');
    return media ? { src: media.src, type: media.tagName.toLowerCase(), alt: media.alt } : null;
  });
  portfolio.accentColor = appearanceColor ? appearanceColor.value : '#0f766e';
  portfolio.boxShape = boxShapeSelect ? boxShapeSelect.value : '16px';
  portfolio.backgroundImage = document.body.classList.contains('custom-background')
    ? document.body.style.backgroundImage.slice(5, -2)
    : '';
  savePortfolios();
};

const loadPortfolio = (portfolio) => {
  activePortfolioId = portfolio.id;
  localStorage.setItem(activePortfolioKey, activePortfolioId);
  closeSidebar();
  ensureIntroTextCount(portfolio.introTextCount || 2);
  ensureCardCount(portfolio.cardCount || 3, portfolio.cardTypes || []);
  document.querySelector('.portfolio-title').textContent = portfolio.name;
  document.title = `${portfolio.name} | Portfolio`;
  getEditorFields().forEach((field, index) => {
    field.textContent = portfolio.content[index] || '';
  });

  document.querySelectorAll('.upload-box').forEach((box, index) => {
    const oldMedia = box.querySelector('img, video');
    if (oldMedia) {
      oldMedia.remove();
    }
    const savedMedia = (portfolio.media || [])[index];
    if (savedMedia) {
      const media = document.createElement(savedMedia.type);
      media.src = savedMedia.src;
      media.alt = savedMedia.alt || '';
      if (savedMedia.type === 'video') {
        media.controls = true;
      }
      box.prepend(media);
      box.classList.add('has-media');
    } else {
      box.classList.remove('has-media');
    }
  });

  applyAppearance(portfolio);
  setEditorEnabled(true);
  document.body.classList.add('portfolio-created');
  renderPortfolioPicker();
};

const createBlankPortfolio = (name) => {
  const portfolio = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    name,
    content: getEditorFields().map(() => ''),
    media: document.querySelectorAll('.upload-box').length ? [...document.querySelectorAll('.upload-box')].map(() => null) : [],
    accentColor: appearanceColor ? appearanceColor.value : '#0f766e',
    backgroundImage: '',
    boxShape: '16px',
    cardCount: document.querySelectorAll('.card').length
  };
  portfolios.push(portfolio);
  savePortfolios();
  loadPortfolio(portfolio);
};

const createTextField = () => {
  const text = document.createElement('p');
  text.contentEditable = 'true';
  text.dataset.placeholder = 'Click to add text';
  text.addEventListener('input', saveActivePortfolio);
  return text;
};

function ensureIntroTextCount(count) {
  const intro = document.querySelector('.intro');
  while (intro && intro.querySelectorAll('[contenteditable]').length < count) {
    intro.append(createTextField());
  }
}

const createBox = (type = 'text') => {
  const card = document.createElement('article');
  card.className = 'card';
  card.dataset.boxType = type;
  const content = {
    text: '<h3 contenteditable="true" data-placeholder="Click to name this box"></h3><p contenteditable="true" data-placeholder="Click to add text"></p>',
    heading: '<h2 contenteditable="true" data-placeholder="Click to add a heading"></h2><p contenteditable="true" data-placeholder="Click to add supporting text"></p>',
    quote: '<blockquote contenteditable="true" data-placeholder="Click to add a quote"></blockquote><p contenteditable="true" data-placeholder="Click to add the source"></p>'
  };
  card.innerHTML = `<button class="delete-box-button" type="button" aria-label="Delete this box">&times;</button>${content[type] || content.text}`;
  document.querySelector('.cards').append(card);
  card.querySelectorAll('[contenteditable]').forEach((field) => {
    field.addEventListener('input', saveActivePortfolio);
  });
  addDeleteButtonListener(card.querySelector('.delete-box-button'));
};

function ensureCardCount(count, types = []) {
  const cards = document.querySelector('.cards');
  while (cards && cards.children.length > count) {
    cards.lastElementChild.remove();
  }
  while (cards && cards.children.length < count) {
    createBox(types[cards.children.length] || 'text');
  }
}

const addDeleteButtonListener = (button) => {
  if (!button) {
    return;
  }

  button.addEventListener('click', () => {
    button.closest('.card').remove();
    saveActivePortfolio();
  });
};

document.querySelectorAll('.delete-box-button').forEach(addDeleteButtonListener);

document.querySelectorAll('[contenteditable]').forEach((field) => {
  field.addEventListener('input', saveActivePortfolio);
});

document.querySelectorAll('.upload-box input[type="file"]').forEach((input) => {
  input.addEventListener('change', () => {
    const file = input.files[0];
    const box = input.closest('.upload-box');
    if (!file || !box) {
      return;
    }

    const reader = new FileReader();
    reader.addEventListener('load', () => {
      const existingMedia = box.querySelector('img, video');
      if (existingMedia) {
        existingMedia.remove();
      }
      const media = document.createElement(file.type.startsWith('video/') ? 'video' : 'img');
      media.src = reader.result;
      media.alt = file.name;
      if (media.tagName === 'VIDEO') {
        media.controls = true;
      }
      box.prepend(media);
      box.classList.add('has-media');
      saveActivePortfolio();
    });
    reader.readAsDataURL(file);
  });
});

if (appearanceColor) {
  appearanceColor.addEventListener('input', () => {
    const activePortfolio = portfolios.find((item) => item.id === activePortfolioId);
    applyAppearance({
      accentColor: appearanceColor.value,
      backgroundImage: activePortfolio ? activePortfolio.backgroundImage : ''
    });
    saveActivePortfolio();
  });
}

if (editingColor) {
  editingColor.addEventListener('input', () => {
    const activePortfolio = portfolios.find((item) => item.id === activePortfolioId);
    applyAppearance({
      accentColor: editingColor.value,
      backgroundImage: activePortfolio ? activePortfolio.backgroundImage : '',
      boxShape: boxShapeSelect.value
    });
    saveActivePortfolio();
  });
}

if (boxShapeSelect) {
  boxShapeSelect.addEventListener('change', () => {
    const activePortfolio = portfolios.find((item) => item.id === activePortfolioId);
    applyAppearance({
      accentColor: editingColor.value,
      backgroundImage: activePortfolio ? activePortfolio.backgroundImage : '',
      boxShape: boxShapeSelect.value
    });
    saveActivePortfolio();
  });
}

if (addBoxButton) {
  addBoxButton.addEventListener('click', () => {
    createBox(boxTypeSelect ? boxTypeSelect.value : 'text');
    saveActivePortfolio();
  });
}

if (addTextButton) {
  addTextButton.addEventListener('click', () => {
    const text = createTextField();
    document.querySelector('.intro').append(text);
    text.focus();
    saveActivePortfolio();
  });
}

if (backgroundImageInput) {
  backgroundImageInput.addEventListener('change', () => {
    const file = backgroundImageInput.files[0];
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      applyAppearance({
        accentColor: appearanceColor.value,
        backgroundImage: reader.result
      });
      saveActivePortfolio();
    });
    reader.readAsDataURL(file);
  });
}

if (newPortfolioForm) {
  setEditorEnabled(false);
  newPortfolioForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const nameInput = newPortfolioForm.querySelector('#portfolio-name');
    const portfolioName = nameInput.value.trim();
    if (!portfolioName) {
      return;
    }
    createBlankPortfolio(portfolioName);
    newPortfolioForm.querySelector('.form-status').textContent = `${portfolioName} is ready to customize.`;
    nameInput.value = '';
  });
}

if (savedPortfoliosSelect) {
  savedPortfoliosSelect.addEventListener('change', () => {
    const portfolio = portfolios.find((item) => item.id === savedPortfoliosSelect.value);
    if (portfolio) {
      loadPortfolio(portfolio);
      closeSidebar();
    }
  });
}

if (newPortfolioButton) {
  newPortfolioButton.addEventListener('click', () => {
    document.body.classList.remove('portfolio-created');
    setEditorEnabled(false);
    activePortfolioId = null;
    localStorage.removeItem(activePortfolioKey);
    renderPortfolioPicker();
    closeSidebar();
  });
}

renderPortfolioPicker();

if (newPortfolioForm && portfolios.length) {
  const savedPortfolio = portfolios.find((portfolio) => portfolio.id === activePortfolioId) || portfolios[0];
  loadPortfolio(savedPortfolio);
}
