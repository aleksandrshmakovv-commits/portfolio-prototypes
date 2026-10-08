# RITM / social design kit

Модельный проект для портфолио: вымышленная студия пилатеса. Не коммерческий заказ, не действующая запись. Фотография создана встроенным imagegen; тексты и геометрия макетов созданы отдельно как редактируемые SVG.

## Состав
1. 01-post — пост-знакомство, 1080 × 1350.
2. 02-carousel-01 — обложка карусели, 1080 × 1350.
3. 03-carousel-02 — три ориентира, 1080 × 1350.
4. 04-carousel-03 — приглашение к записи, 1080 × 1350.
5. 05-story — эмоциональная stories, 1080 × 1920.
6. 06-story-cta — stories с CTA, 1080 × 1920.

`editable/` — автономные SVG: настоящий текст, редактируемые векторные фигуры, фотография встроена data URI. `exports/` — PNG в исходном размере. `assets/overview.png` — контактный лист; `assets/pilates-editorial.png` — исходная фотография.

## Фотографии
Фотографии в макетах — тестовые. Перед публикацией их нужно заменить на реальные фотографии студии или согласованные изображения заказчика.

## Редактирование
Откройте SVG в редакторе, поддерживающем SVG-текст, изображения data URI и clipping paths. Текст — Arial / Arial Bold: для прежней вёрстки этот системный шрифт должен быть установлен. Шрифт не включён в архив. При импорте в Figma/Illustrator конкретный редактор может изменить представление текста; исходный SVG сохраняет элементы `<text>`. Редактируемость проверена на уровне исходного XML, импорт в эти приложения не проверялся.

Цвета: #224CF2, #F6F7FB, #D7FF3F, #12141C. Поля 60 px. Оставляйте одну главную мысль на экран. Перед реальным использованием замените модельную запись контактами студии и проверьте интерфейсные safe-зоны выбранной платформы. Фото — синтетический визуал, не фотография клиента.

## Проверки
Все 6 SVG открыты headless Chrome и экспортированы в PNG 1:1. Проверены размеры и декодирование PNG, автономность фото, наличие редактируемого текста, локальные ссылки, десктопная и мобильная вёрстка страницы, открытие/закрытие просмотрщика. Состав архива и его CRC проверены. Подробности — QA.md рядом с кейсом. Публикация на платформы и влияние на конверсию не проверялись.

## Фото / built-in imagegen prompt
Editorial photograph for a fictional Pilates studio social-media campaign RITM. High-end wellness editorial, portrait 4:5. Adult woman around 30, natural face, dark hair tied neatly, matte ultramarine blue workout top and black leggings, barefoot on a pale reformer in a spacious minimalist off-white studio; calm controlled seated stretching position, one straight leg along the carriage and arms reaching forward. Accurate anatomy and believable equipment. Reformer diagonal from lower left to upper right. Full body, subject central/lower two thirds. Pale daylight, architectural shadows, tactile linen floor, 50mm lens. Pale neutral and #224CF2. No text, logo, watermark or collage.
