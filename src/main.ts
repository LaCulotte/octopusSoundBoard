import * as fs from "fs";
import { SoundBoard } from "./SoundBoard";

let settingsPath = "./settings.json";
let settings = JSON.parse(fs.readFileSync(settingsPath).toString());

let soundboard = new SoundBoard("ws://localhost:8000", settings["sounds"], settings["musics"]);
soundboard.connect();