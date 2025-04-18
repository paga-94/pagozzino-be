import dotenv from "dotenv";
import { GoogleAuth } from "google-auth-library";
import { drive_v3 } from "googleapis/build/src/apis/drive";

dotenv.config();

const SCOPES = [
	"https://www.googleapis.com/auth/drive.readonly",
	"https://www.googleapis.com/auth/drive.file",
	"https://www.googleapis.com/auth/drive",
];

const DRIVE_FILE_ID = process.env.DRIVE_FILE_ID;

const auth = new GoogleAuth({
	credentials: {
		type: process.env.TYPE,
		project_id: process.env.PROJECT_ID,
		private_key_id: process.env.PRIVATE_KEY_ID,
		private_key: process.env.PRIVATE_KEY?.replace(/\\n/g, "\n"),
		client_email: process.env.CLIENT_EMAIL,
		client_id: process.env.CLIENT_ID,
		universe_domain: process.env.UNIVERSE_DOMAIN,
	},
	scopes: SCOPES,
});

const drive = new drive_v3.Drive({ auth });

export const readJsonFromDrive = async () => {
	const res = await drive.files.get(
		{ fileId: DRIVE_FILE_ID, alt: "media", supportsAllDrives: true },
		{ responseType: "stream" }
	);

	return new Promise<any>((resolve, reject) => {
		let data = "";
		res.data
			.on("data", (chunk) => (data += chunk))
			.on("end", () => resolve(JSON.parse(data)))
			.on("error", reject);
	});
};

export const writeJsonToDrive = async (jsonData: any) => {
	const buffer = Buffer.from(JSON.stringify(jsonData, null, 2));

	await drive.files.update({
		fileId: DRIVE_FILE_ID,
		media: {
			mimeType: "application/json",
			body: buffer,
		},
	});
};
