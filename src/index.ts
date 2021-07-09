import express, { Request, Response } from "express";
import cors from "cors";
import ParseTorrent from "parse-torrent";
import ParseTorrentFile from "parse-torrent-file";

export default class TorrentURLIndex {
	private app = express();
	private torrents: ParseTorrentFile.Instance[] = [];

	constructor(port = 8000) {
		this.app.use(express.json());
		this.app.use(cors());
		const listener = this.app.listen(port, () => {
			console.log("app listening at", listener.address());
			this.registerRoutes();
		});
	}

	private getTorrentByURL(url: string): ParseTorrentFile.Instance | null {
		const torrent = this.torrents.find(({ urlList }) => {
			return urlList?.find(item => item === url);
		});
		return torrent ?? null;
	}

	private getTorrentByHash(hash: string): ParseTorrentFile.Instance | null {
		const torrent = this.torrents.find(({ infoHash }) => {
			return infoHash === hash;
		});
		return torrent ?? null;
	}

	private registerRoutes() {
		this.app.get("/:url(*)", (req: Request, res: Response) => {
			console.log("FETCH TORRENT", req.params.url);
			const torrent = this.getTorrentByURL(req.params.url);
			if (torrent) {
				res.setHeader("Content-Type", "application/x-bittorrent");
				res.send(ParseTorrent.toTorrentFile(torrent));
			} else res.sendStatus(404);
		});

		this.app.post("/", (req: Request, res: Response) => {
			console.log("REGISTER TORRENT", req.body.url);
			const recievedTorrent: ParseTorrentFile.Instance = <
				ParseTorrentFile.Instance
			>ParseTorrent(Buffer.from(req.body.torrent));

			const torrent = this.getTorrentByHash(<string>recievedTorrent.infoHash);

			if (torrent) {
				torrent.urlList?.push(req.body.url);
			} else {
				recievedTorrent.urlList?.push(req.body.url);
				this.torrents.push(recievedTorrent);
			}
			res.sendStatus(201);

			console.log("TORRENTS", this.torrents);
		});
	}
}