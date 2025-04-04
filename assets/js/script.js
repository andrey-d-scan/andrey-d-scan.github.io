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

            // Закрытие меню
            if (target.closest('.menu__close') || target.closest('.menu__item:not(.menu__item--dropdown)')) {
                menu.classList.remove('menu__wrapper-active');
            }

            // Открытие подменю
            const dropdownItem = target.closest('.menu__item--dropdown');
            if (dropdownItem) {
                // event.preventDefault(); // Предотвращаем переход по ссылке
                dropdownItem.classList.toggle('active');
                console.log('Dropdown toggled, active:', dropdownItem.classList.contains('active')); // Отладка
            }
        });
    }
});