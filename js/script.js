document.addEventListener("DOMContentLoaded", () => {
    const hamburger = document.querySelector('.hamburger'),
          menu = document.querySelector('.menu__wrapper');

    if (hamburger && menu) {
        hamburger.addEventListener('click', () => {
            menu.classList.add('menu__wrapper-active');
        });
    } 

    if (menu) {
        menu.addEventListener('click', (event) => {
            const target = event.target;
            if (target.closest('.menu__close') || target.closest('.menu__item')) {
                menu.classList.remove('menu__wrapper-active');
            }
        });
    } 
});
