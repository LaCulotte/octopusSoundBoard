import { OctopusApp } from "octopus-app";
import * as playSound from 'play-sound';
import * as mplayer from 'mplayer';
import { v4 } from "uuid";

export class SoundBoard extends OctopusApp {
    type: string = "Soundboard";
    
    player: any;
    
    sounds: any;
    musics: any;

    players: Map<string, any> = new Map();
    
    musicPlayer = undefined;
    musicVolume = 100;
    musicPlayerUUID = undefined;
    musicPlayerTimeout = 500;
    musicPlayerTimeoutId = undefined;
    musicPlayerTimedout = false;
    musicPaused = false;
    musicFullPlaylist: Array<string> = [];
    musicPlaylist: Array<string> = [];

    constructor(octopusUrl: string, sounds: any, musics: any) {
        super(octopusUrl);

        this.sounds = sounds;
        // this.musics = musics;
        this.musics = {};
        for(let musicName in musics) {
            this.musics[musicName] = {
                path: musics[musicName].path,
                tags: new Set(musics[musicName].tags)
            }
        }
    }

    destroyMusicPlayer() {
        if(!this.musicPlayer)
            return;

        this.musicPlayer.on('stop', () => {});
        this.musicPlayer.on('pause', () => {});
        this.musicPlayer.on('play', () => {});
        //this.musicPlayer.seekPercent(100);
        this.musicPlayer.stop();
        this.musicPlayer = undefined;
        this.musicPlayerUUID = undefined;
    }

    newMusicPlayer() {
        let newmusicPlayer = new mplayer.default();
        let uuid = v4();
        this.musicPlayerUUID = uuid;

        newmusicPlayer.on('play', () => { 
            this.musicPaused = false; 
        });

        newmusicPlayer.on('pause', () => { this.musicPaused = true; });
        newmusicPlayer.on('stop', () => {
            // This check should technically not be necessary
            if(uuid == this.musicPlayerUUID)
                this.nextMusic(); 
        });

        newmusicPlayer.volume(this.musicVolume);

        return newmusicPlayer;
    }

    onInit(message: any): boolean {
        if(!super.onInit(message))
            return false;
        
        this.subscribeToBroadcast("PlaySound")
            .then(() => console.log(`[${this.logHeader}] Listening to incoming sounds.`))
            .catch((err) => console.log(`[${this.logHeader}] Could not subscribe to PlaySound broadcast : ${err}`));

        this.subscribeToBroadcast("PlayMusic")
            .then(() => console.log(`[${this.logHeader}] Listening to incoming musics.`))
            .catch((err) => console.log(`[${this.logHeader}] Could not subscribe to PlayMusic broadcast : ${err}`));
            
        this.subscribeToBroadcast("MusicVolume")
            // .then(() => console.log(`[${this.logHeader}] Listening to 'MusicVolume'.`))
            .catch((err) => console.log(`[${this.logHeader}] Could not subscribe to MusicVolume broadcast : ${err}`));

        this.subscribeToBroadcast("NextMusic")
            // .then(() => console.log(`[${this.logHeader}] Listening to 'NextMusic'.`))
            .catch((err) => console.log(`[${this.logHeader}] Could not subscribe to NextMusic broadcast : ${err}`));

        this.subscribeToBroadcast("StopSounds")
            // .then(() => console.log(`[${this.logHeader}] Listening to 'StopSounds'.`))
            .catch((err) => console.log(`[${this.logHeader}] Could not subscribe to StopSounds broadcast : ${err}`));

        return true;
    }

    onBroadcast(message: any): void {
        super.onBroadcast(message);

        switch(message.channel) {
            case "PlaySound":
                this.playSound(message.content);
                break;

            case "PlayMusic":
                this.startPlaylist(message.content);
                break;

            case "MusicVolume":
                this.updateVolume(message.content["volume"]);
                break;

            case "NextMusic":
                this.nextMusic();
                break;
    
            case "StopSounds":
                this.stopAll();
                break;

            default:
                console.warn(`[${this.logHeader}] Unknown broadcast channel : ${message.channel}`);
                break;    
        }
    }



    playSound(soundInfos: any) {
        let soundName = soundInfos["name"];
        let volume = soundInfos["volume"];

        let player = this.players[soundName]; 
        if (player) {
            player.seek(0);
            player.volume(volume);
            console.log(volume);
        } else {
            let soundPath = this.sounds[soundName];
            if (!soundPath) {
                console.log(`[${this.logHeader}] Cannot find sound ${soundName}`);
                return;
            }

            player = new mplayer.default();
            player.on('stop', () => { delete this.players[soundName]; });
            player.openFile(soundPath);
            player.volume(volume);

            this.players[soundName] = player;
        }
    }

    startPlaylist(playlistInfos: any) {
        let playTagsStr = playlistInfos["name"];
        this.musicVolume = playlistInfos["volume"];

        let playTags = playTagsStr.split(";");
        
        this.musicFullPlaylist = [];

        for(let i in this.musics) {
            let tags = this.musics[i].tags as Set<any>;

            let play = true;
            for(let tag of playTags) {
                if(!tags.has(tag)) {
                    play = false;
                    break;
                }
            }

            if(play) 
                this.musicFullPlaylist.push(i);
        }

        this.musicPlaylist = JSON.parse(JSON.stringify(this.musicFullPlaylist));
        this.nextMusic();
    }

    nextMusic() {
        if(this.musicPlayerTimedout)
            return;

        this.destroyMusicPlayer();

        if(this.musicPlaylist.length <= 0) {
            this.musicPlaylist = JSON.parse(JSON.stringify(this.musicFullPlaylist));
        }

        if(this.musicPlaylist.length <= 0)
            return;

        let index = Math.floor(Math.random() * this.musicPlaylist.length);
        let musicName = this.musicPlaylist.splice(index, 1)[0];

        this.musicPlayer = this.newMusicPlayer();        
        // Let some time for the previous music to stop properly
        setTimeout(() => { 
                console.log(this.musics[musicName].path);
                this.musicPlayer.openFile(this.musics[musicName].path);
                this.musicPlayer.volume(this.musicVolume);
                this.musicPaused = false;
                console.log(`Playing ${musicName}`);
            }, 1000);
        
        // Avoid spam, it breaks mp4player
        if(this.musicPlayerTimeoutId)
            clearTimeout(this.musicPlayerTimeoutId);
        this.musicPlayerTimeoutId = setTimeout(() => { this.musicPlayerTimedout = false; }, this.musicPlayerTimeout);
        this.musicPlayerTimedout = true;

    }

    updateVolume(volume: number) {
        this.musicVolume = volume;
        if(this.musicPlayer)
            this.musicPlayer.volume(volume);
    }

    pauseMusic() {
        if(this.musicPlayer) {
            if(this.musicPaused) {
                this.musicPlayer.play();
                this.musicPaused = false;
            }
            else {
                this.musicPlayer.pause();
                this.musicPaused = true;
            }
        }
    }

    stopAll() {
        for(let name in this.players) {
            this.players[name].stop();
        }

        this.pauseMusic();

        this.players = new Map();
    }

    get logHeader(): string {
        return `Soundboard`
    }
}