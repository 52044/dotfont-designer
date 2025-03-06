DOTFONT_VERSION = 1

import webview
import webview.menu as wm

import json

def nop():pass

class api():
    def __init__(self):
        self.font = {}
        self.font['metadata'] = {}
        self.font['metadata']['width'] = 8
        self.font['metadata']['height'] = 8

    def message(self, message, type=None):
        match type:
            case "error": color = "rgb(250, 0, 0.3)"
            case "warn":  color = "rgba(250, 250, 0, 0.3)"
            case "ok":    color = "rgba(0, 250, 0, 0.3)"
            case None:    color = "rgba(200, 200, 200, 0.3)"
        app.run_js(f"showMessage('{message}', '{color}', 5000)")

    ### File maniuplation ###
    def settings_save(self, settings):
        self.font['metadata']['name'] = settings['font_name']
        self.font['metadata']['author'] = settings['font_author']
        self.font['metadata']['copyright'] = settings['font_copyright']
        self.font['metadata']['width'] = settings['font_sizex']
        self.font['metadata']['height'] = settings['font_sizey']
        self.font['metadata']['spacing'] = settings['font_spacing']
        self.font['metadata']['baseline'] = settings['font_baseline']

    def settings_set(self):
            app.run_js(f"settings_set({self.font['metadata']})")

    def file_load(self):
        # Load font
        result = app.create_file_dialog(
            webview.OPEN_DIALOG, 
            file_types=('json file (*.json)', 'All files (*.*)')
        )
        if result is not None:
            with open(result[0], 'r', encoding='utf-8') as file:
                font = json.load(file)
                self.file=result[0]
            try:
                font['dotfont']
            except:
                self.message('This is not dotfont file', 'error')
                return
        else:
            self.message('Font is not loaded. Aborted by user', 'warn') 
            return
        self.file = result[0].replace('\\', '/')
        
        app.run_js(f'font = {font}')
        app.run_js('file_loadSettings()')

        self.message(f'Font {font["metadata"]["name"]} loaded sucsessfuly!', 'ok')

    def file_saveas(self, font):
        try:
            name = self.font['metadata']['name'] + '.json'
        except KeyError:
            name = 'dotfont.json'
        result = app.create_file_dialog(
            webview.SAVE_DIALOG,
            file_types=('json file (*.json)', 'All files (*.*)'),
            save_filename=(name)
        )
        if result is None:
            self.message('Font is not saved. Aborted by user', 'warn')
            return
        else:
            result = result.replace('\\', '/') # type: ignore
            self.__dump_json__(result, font)
            self.file = result
            self.message(f'Font saved at {result}', 'ok')

    def file_save(self, font):
        try:
            self.__dump_json__(self.file, font)
            self.message(f'Font saved at {self.file}', 'ok')
        except AttributeError:
            self.file_saveas(font)
            
    def __dump_json__(self, path, font):
        def remove_empty_characters(font):
            characters = font['characters']

            to_delete = []

            for key, value in characters.items():
                if key == "32":
                    continue  # Пропускаем пробел
                
                # Проверяем, содержит ли символ хотя бы одну 1
                if all(all(row == 0 for row in value) for value in characters[key]):
                    to_delete.append(key)

            # Удаляем пустые символы
            for key in to_delete:
                del characters[key]

            return font
        
        font = remove_empty_characters(font)
        # сохраняем 
        with open(path, "w", encoding="utf-8") as file:
            json.dump(font, file, ensure_ascii=False, separators=(',', ':'), indent=0)

if __name__ == "__main__":
    # Кофигурация окна приложения
    app = webview.create_window(
        "dotfont-designer", 
        'html/index.html',
        js_api=api(), 
        width=800, 
        height=600, 
        )
    
    # Старт программы
    webview.start()