function loadSocial() {
    fetch('/assets/headers/social.html')
        .then(response => response.text())
        .then(html => document.querySelectorAll('.menu__social').forEach(container => container.innerHTML = html))
        .catch(err => console.error('Error loading social:', err));
}
document.addEventListener('DOMContentLoaded', () => {
    const headerContainer = document.getElementById('header');

    fetch('/assets/headers/header.html')
        .then(response => response.text())
        .then(html => {
            headerContainer.innerHTML = html;
            loadSocial();

            // Определяем текущий язык
            const lang = localStorage.getItem('lang') || window.location.pathname.match(/^\/([a-z]{2})\//)?.[1] || 'en';
            const links = document.querySelectorAll('[data-link]');
            const elements = document.querySelectorAll('[data-i18n]');
            const langCurrent = document.querySelector('.menu__lang-current');
            const langItems = document.querySelectorAll('.menu__lang-list li');

            // Устанавливаем текущий язык в меню
            if (langCurrent) {
                langCurrent.textContent = lang.toUpperCase();
            }

            // Функция для загрузки и применения переводов
            function applyTranslations(lang) {
                if (lang === 'en') {
                    const elements = document.querySelectorAll('[data-i18n]');
                    elements.forEach(elem => {
                        if (elem.dataset.originalText === undefined) {
                            elem.dataset.originalText = elem.textContent;
                        }
                        elem.textContent = elem.dataset.originalText;
                    });
                    return;
                }
            
                fetch(`/assets/lang/${lang}.json`)
                    .then(response => response.json())
                    .then(data => {
                        links.forEach(link => {
                            const key = link.dataset.link;
                            if (data.links && data.links[key]) {
                                link.href = data.links[key];
                            }
                            if (data[key]) {
                                link.textContent = data[key];
                            }
                        });
            
                        const elements = document.querySelectorAll('[data-i18n]');
                        elements.forEach(elem => {
                            const key = elem.dataset.i18n;
                            if (data[key]) {
                                if (elem.dataset.originalText === undefined) {
                                    elem.dataset.originalText = elem.textContent;
                                }
                                elem.textContent = data[key];
                            }
                        });
                    });
            }

            
            // Обработчик выбора языка
            langItems.forEach(item => {
                item.addEventListener('click', (e) => {
                    e.preventDefault();
                    const newLang = item.dataset.lang;

                    if (newLang === lang) return;

                    // Сохраняем новый язык
                    localStorage.setItem('lang', newLang);

                    // Текущий путь
                    const currentPath = window.location.pathname;

                    let newPath;
                    if (newLang === 'en') {
                        // Для английского: убираем /ru/ из пути
                        newPath = currentPath.replace(/^\/ru\//, '/');
                    } else {
                        // Для русского: берем ссылку из ru.json
                        fetch(`/assets/lang/${newLang}.json`)
                            .then(response => response.json())
                            .then(data => {
                                // Ищем ссылку, соответствующую текущей странице
                                const pageName = currentPath.split('/').pop().replace(/\.html$/, ''); // Например, "index" или "smart_home"
                                let linkKey;
                                for (const key in data.links) {
                                    if (data.links[key].endsWith(`/${pageName}.html`)) {
                                        linkKey = key;
                                        break;
                                    }
                                }

                                if (linkKey && data.links[linkKey]) {
                                    newPath = data.links[linkKey]; // Например, "/ru/index.html"
                                } else {
                                    // Если ссылка не найдена, оставляем текущий путь (непереводимая страница)
                                    newPath = currentPath;
                                }

                                window.location.href = newPath;
                            })
                            .catch(() => {
                                // Если ошибка, оставляем текущий путь
                                window.location.href = currentPath;
                            });
                        return; // Чтобы не выполнять window.location.href сразу
                    }

                    window.location.href = newPath;
                });
            });

            // Мобильное меню
            const hamburger = document.querySelector('.hamburger');
            const menu = document.querySelector('.menu__wrapper');

            if (hamburger && menu) {
                hamburger.addEventListener('click', () => {
                    menu.classList.add('menu__wrapper-active');
                });
            }

            if (menu) {
                menu.addEventListener('click', (event) => {
                    const target = event.target;

                    // Закрытие меню
                    if (target.closest('.menu__close') || target.closest('.menu__item:not(.menu__item--dropdown)')) {
                        menu.classList.remove('menu__wrapper-active');
                    }

                    // Открытие подменю
                    const dropdownItem = target.closest('.menu__item--dropdown');
                    if (dropdownItem) {
                        menu.querySelectorAll('.menu__item--dropdown.active').forEach(item => {
                            if (item !== dropdownItem) item.classList.remove('active');
                        });
                        dropdownItem.classList.toggle('active');
                    }
                });
            }

            // Загрузка футера
            const footerContainer = document.getElementById('footer');
            if (footerContainer) {
                fetch('/assets/headers/footer.html')
                .then(response => response.text())
                .then(html => {
                    footerContainer.innerHTML = html;
                    loadSocial();
                    applyTranslations(lang);
                })
                .catch(err => console.error('Error loading footer:', err));
            }

            // Применяем переводы после загрузки хедера
            applyTranslations(lang);

        })
        .catch(err => console.error('Error loading header:', err));
});