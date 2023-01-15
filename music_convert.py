import youtube_dl
import json

from os import listdir
import shutil

def run():
    for filename in listdir("./musics_before"):
        print(f"Will download {filename}")
        new_filename = filename.replace(" - ", "-").replace(" ", "_")
        new_path = f"musics\\{new_filename}"

        tags = []
        tag = input("Enter tag ")
        while len(tag) > 0:
            tags.append(tag)
            tag = input("Enter tag ")

        settings = {}
        with open("settings.json", "r") as f:
            settings = json.load(f)

        settings["musics"][new_filename.replace(".mp3", "")] = {
            "path": new_path.replace("\\", "/"),
            "tags": tags
        }

        with open("settings.json", "w") as f:
            json.dump(settings, f, indent=4)

        shutil.copy(f"musics_before\\{filename}", new_path)
        shutil.move(f"musics_before\\{filename}", f"musics_done\\{filename}")
 
def run2():
    for filename in listdir("./sounds_before"):
        print(f"Will download {filename}")
        new_filename = input("New filename ")
        if(len(new_filename) == 0):
            new_filename = filename

        new_path = f"sounds\\{new_filename}"

        tag = input("Enter tag ")

        settings = {}
        with open("settings.json", "r") as f:
            settings = json.load(f)

        settings["sounds"][tag] = new_path.replace("\\", "/")

        with open("settings.json", "w") as f:
            json.dump(settings, f, indent=4)

        shutil.move(f"sounds_before\\{filename}", new_path)

if __name__=='__main__':
    run()