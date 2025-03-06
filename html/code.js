//---------- UI Code ----------//

/**
* Функция, которая показывает или скрывает элемент на странице.
*
* @param {string} element - Селектор элемента, который нужно показать или скрыть.
* @param {boolean} value - Значение, определяющее, нужно ли показать элемент (true) или скрыть (false).
*/
function show(element, value) {
   const target = document.querySelector(element);
   switch(value) {
       case true: target.style.display = "block"; break;
       case false: target.style.display = "none"; break;
   }
}

/**
* Функция, которая показывает сообщение на странице.
*
* @param {string} text - Текст сообщения.
* @param {string} [bgColor='#f8f9fa'] - Цвет фона сообщения.
* @param {number} [duration=3000] - Продолжительность отображения сообщения в миллисекундах.
*/
function showMessage(text, bgColor = '#f8f9fa', duration = 3000) {
   const message = document.createElement('div');
   message.className = 'container message';
   message.textContent = text;
   message.style.backgroundColor = bgColor;

   document.body.appendChild(message);
   setTimeout(() => message.classList.add('visible'), 50);
   setTimeout(() => {
       message.classList.remove('visible');
       setTimeout(() => message.remove(), 300);
   }, duration);
}

/**
* Функция combo_charRange создает элемент <select> с опциями, полученными из CSV-файла.
* После выбора опции генерируется таблица с помощью функции table_charTable.
*
* @param {string} elementID - ID элемента <select>.
* @param {string} csv - Путь к CSV-файлу.
*/
function combo_charRange(elementID, csv) {
   const select = document.getElementById(elementID);

   const defaultOption = document.createElement('option');
   defaultOption.value = '';
   defaultOption.textContent = '--- Select range ---';
   select.appendChild(defaultOption);

   // Загружаем CSV-файл
   fetch(csv)
       .then(response => response.text())
       .then(data => {
           // Парсим CSV
           const rows = data.split('\n').map(row => row.split(','));

           // Добавляем данные в <select>
           rows.forEach(row => {
               if (row.length >= 3) { // Проверяем, что в строке достаточно данных
                   const option = document.createElement('option');
                   option.value = `${row[0]},${row[1]}`; // value = (row[0], row[1])
                   option.textContent = `[${row[0]} - ${row[1]}] ${row[2]}`; // Текст = [row[0] - row[1]] row[2]
                   select.appendChild(option);
               }
           });

           // Обработчик изменения выбора в <select>
           select.addEventListener('change', function () {
               const [start, end] = this.value.split(',').map(Number); // Получаем диапазон
               table_charTable('container_charTable', 'table_chars', start, end); // Генерируем таблицу
           });
       })
       .catch(error => console.error('Ошибка при загрузке CSV:', error));
}

/**
 * Создает таблицу символов Unicode в указанном диапазоне.
 * @param {string} elementID - ID элемента, в который будет добавлена таблица.
 * @param {string} id - ID таблицы.
 * @param {number} start - Начальный символ Unicode.
 * @param {number} end - Конечный символ Unicode.
 */
function table_charTable(elementID, id, start, end) {
    const container = document.getElementById(elementID);
    container.innerHTML = ''
    const table = document.createElement('table');
    table.id = id;

    const headers = ['Hex', 'Char', 'Bitmap'];
    const headerRow = document.createElement('tr');
    headers.forEach(headerText => {
        const th = document.createElement('th');
        th.textContent = headerText;
        headerRow.appendChild(th);
        table.appendChild(headerRow);
    });
     
    for (let i = start; i <= end; i++) {
        const row = document.createElement('tr');
        row.setAttribute('char', i);

        const hex = document.createElement('td');
        hex.textContent = `0x${i.toString(16).toUpperCase()}`;
        row.appendChild(hex);
        
        const char = document.createElement('td');
        char.textContent = String.fromCharCode(i);
        row.appendChild(char);

        const bitmap = document.createElement('td');
        bitmap.className = 'bitmap';
        const img = document.createElement('img');
        try {
            img.src = createImage('', 2, font['characters'][i]).src;
            bitmap.innerHTML = ''
            bitmap.appendChild(img);
        } catch (err) {}
        row.appendChild(bitmap);

        row.addEventListener('click', function () {
            // Убираем выделение у всех строк и выделяем текущую
            const rows = table.getElementsByTagName('tr');
            for (let j = 1; j < rows.length; j++) {
                rows[j].classList.remove('selected');
            }
            this.classList.add('selected');

            // Создаем event
            const event = new CustomEvent('char-selected', {
                detail: i,
                bubbles: true,
                cancelable: true,
            });
            this.dispatchEvent(event);
        });
        table.appendChild(row);
    }

    container.appendChild(table);
}

/* Холст */
function PixelCanvas(containerId, ch, width = 8, height = 8, arr) {
    const container = document.getElementById(containerId);
    const pixelSize = 30;
    let isDrawing = false;
    let currentAction = null; // 'add' или 'remove'
    const cur_char = ch;
    
    let matrix = arr;
    // Инициализация матрицы
    if (arr) {matrix = arr} else {matrix = Array(height).fill().map(() => Array(width).fill(0));}
    
    // Создание сетки
    const grid = document.createElement('div');
    grid.className = 'pixel-grid';
    grid.style.gridTemplateColumns = `repeat(${width}, ${pixelSize}px)`;

    // Создание пикселей
    matrix.forEach((row, y) => {
        row.forEach((_, x) => {
            const pixel = document.createElement('div');
            pixel.className = 'pixel';
            pixel.style.width = `${pixelSize}px`;
            pixel.style.height = `${pixelSize}px`;
            pixel.dataset.y = y;
            pixel.dataset.x = x;
            if (matrix[y][x] === 1) {
                pixel.classList.add('active');
            }
            grid.appendChild(pixel);
        });
    });

    // Обработчики событий
    let startY, startX;
    
    const startDrawing = (pixel, y, x) => {
        isDrawing = true;
        currentAction = pixel.classList.contains('active') ? 'remove' : 'add';
        updatePixel(y, x);
    };

    const updatePixel = (y, x) => {
        const pixel = grid.querySelector(`[data-y="${y}"][data-x="${x}"]`);
        if(currentAction === 'add' && !pixel.classList.contains('active')) {
            pixel.classList.add('active');
            matrix[y][x] = 1;
        }
        if(currentAction === 'remove' && pixel.classList.contains('active')) {
            pixel.classList.remove('active');
            matrix[y][x] = 0;
        }
    };

    // Делегирование событий
    grid.addEventListener('mousedown', (e) => {
        const pixel = e.target.closest('.pixel');
        if(pixel) {
            startY = parseInt(pixel.dataset.y);
            startX = parseInt(pixel.dataset.x);
            startDrawing(pixel, startY, startX);
        }
    });

    grid.addEventListener('mouseover', (e) => {
        if(!isDrawing) return;
        const pixel = e.target.closest('.pixel');
        if(pixel) {
            const y = parseInt(pixel.dataset.y);
            const x = parseInt(pixel.dataset.x);
            updatePixel(y, x);
        }
    });

    document.addEventListener('mouseup', () => {
        isDrawing = false;
        currentAction = null;

        font['characters'][cur_char] = matrix;
    });

    container.innerHTML = '';
    container.appendChild(grid);
    
    return {
        getMatrix: () => matrix,
        getChar: () => cur_char,
        getCanvasHeight: () => {
            const containerRect = container.getBoundingClientRect();
            return containerRect.height
        },
    };
}

//---------- Additional code ----------//

function insertImageIntoBitmapCell(rowIndex, imageSrc) {
    const tr = document.querySelector(`tr[char="${rowIndex}"]`);
    if (!tr) {
        console.error(`Не найден <tr> с char="${rowIndex}"`);
        return;
    }

    let th = tr.querySelector("td.bitmap");
    if (!th) {
        console.error(`В <tr char="${rowIndex}"> отсутствует <td class="bitmap">`);
        return;
    }

    const img = document.createElement('img');
    img.src = imageSrc;

    th.innerHTML = '';
    th.appendChild(img);
}


/* Создание изображения из матрицы */
function createImage(canv, scale = 1, or_matrix) {
    let matrix = null
    if (or_matrix) {matrix = or_matrix; }
    else {matrix = canv.getMatrix();} // Получаем матрицу пикселей
    const width = matrix[0].length;   // Ширина матрицы
    const height = matrix.length;     // Высота матрицы

    // Создаем элемент <canvas>
    const canvasElement = document.createElement('canvas');
    canvasElement.width = width * scale;
    canvasElement.height = height * scale;
    const ctx = canvasElement.getContext('2d');

    // Рисуем пиксели на canvas
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const color = matrix[y][x] ? 'black' : 'white'; // Черный или белый пиксель
            ctx.fillStyle = color;
            ctx.fillRect(x * scale, y * scale, scale, scale); // Рисуем пиксель
        }
    }

    // Преобразуем canvas в изображение
    const image = new Image();
    image.src = canvasElement.toDataURL(); // Получаем Data URL изображения
    image.alt = 'Pixel Art';

    return image;
}

//---------- Events ----------//

// Click - Save settings (in float window)
function click_saveSettings() {
    font['metadata']['name'] = document.getElementById("font_name").value;
    font['metadata']['author'] = document.getElementById("font_author").value;
    font['metadata']['copyright'] = document.getElementById("font_copyright").value;
    font['metadata']['width'] = parseInt(document.getElementById("font_sizex").value);
    font['metadata']['height'] = parseInt(document.getElementById("font_sizey").value);
    font['metadata']['spacing'] = parseInt(document.getElementById("font_spacing").value);
    font['metadata']['baseline'] = parseInt(document.getElementById("font_baseline").value);
    
    show('#font_settings', false);
}

// Event - Char selected 
document.addEventListener('char-selected', function(event) {
    // Вставляем изображение в таблицу
    try{
        insertImageIntoBitmapCell(canvas.getChar(), createImage(canvas, 2).src);
    } catch (err) {
        console.log('blyad. '+ err.message);
    }

    // Создаем полотно и восстанавливаем изображение
    if (font['characters'][event.detail] == null) {
        canvas = PixelCanvas('char_canvas', event.detail, font['metadata']['width'], font['metadata']['height']);
    } else {
        canvas = PixelCanvas('char_canvas', event.detail, font['metadata']['width'], font['metadata']['height'], font['characters'][event.detail]);
    }

    // Добавляем референс и задаем ему высоту
    const reference = document.getElementById('char_reference');
    reference.innerHTML = String.fromCharCode(event.detail);
    reference.style.height = `${canvas.getCanvasHeight()}px`;
});

//---------- API Code ----------//
function file_load(){
    window.pywebview.api.file_load();
}
function file_save(){
    window.pywebview.api.file_save(font)
}
function file_saveas(){
    window.pywebview.api.file_saveas(font)
}

function file_loadSettings(){
    document.getElementById('font_name').value = font['metadata']['name'];
    document.getElementById('font_author').value = font['metadata']['author'];
    document.getElementById('font_copyright').value = font['metadata']['copyright'];
    document.getElementById('font_sizex').value = font['metadata']['width'];
    document.getElementById('font_sizey').value = font['metadata']['height'];
    document.getElementById('font_spacing').value = font['metadata']['spacing'];
    document.getElementById('font_baseline').value = font['metadata']['baseline'];
}
//---------- On load sequence (main) ----------//

var font = {}; // Font object
font['dotfont'] = 1;
font['metadata'] = {};
font['metadata']['name'] = '';
font['metadata']['author'] = '';
font['metadata']['copyright'] = '';
font['metadata']['width'] = 8;
font['metadata']['height'] = 8;
font['metadata']['spacing'] = 0;
font['metadata']['baseline'] = 0;
font["characters"] = {};


document.addEventListener('DOMContentLoaded', function(){
    combo_charRange('combo_charRange', './utf-8.csv')
});