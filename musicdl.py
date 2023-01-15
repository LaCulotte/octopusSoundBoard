import youtube_dl
import json

def run():
    video_url = input("please enter youtube video url:")
    # video_info = youtube_dl.YoutubeDL({"noplaylist": True}).extract_info(
    #     url = video_url,download=False
    # )

    # filename = f"{video_info['title']}.mp3".replace(" ", "_")
    # print(f"Will download {filename}")

    # tags = []
    # tag=" "
    # while len(tag) > 0:
    #     tag = input("Enter tag")
    #     tags.append(tag)

    options={
        'format':'bestaudio/best',
        'keepvideo':False,
        # 'outtmpl':f'musics/{filename}',
        # "noplaylist": True
    }

    with youtube_dl.YoutubeDL(options) as ydl:
        ydl.download([video_url])

    print("Download complete... {}".format(filename))

    # settings = {}
    # with open("settings.json", "r") as f:
    #     settings = json.load(f)

    # settings["musics"][name] = {
    #     "name": name,
    #     "tags": tags
    # }

    # with open("settings.json", "w") as f:
    #     settings = json.dump(f, indent=4)

if __name__=='__main__':
    # while True:
    run()