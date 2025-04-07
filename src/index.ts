import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import nodemailer from "nodemailer";
import { readJsonFromDrive, writeJsonToDrive } from "./googleDrive";

dotenv.config();

const app = express();
const PORT = 3001;
const EMAIL = process.env.EMAIL;
const EMAIL_PASS = process.env.EMAIL_PASS;

app.use(express.json());
app.use(cors());

type Status = "ci sono" | "non ci sono" | null;

interface Guest {
	id: number;
	nome: string;
	cognome: string;
	status: Status;
	note?: string;
}

const transporter = nodemailer.createTransport({
	service: "gmail",
	auth: {
		user: EMAIL,
		pass: EMAIL_PASS,
	},
});

const sendEmail = (data: Guest[], guest?: Guest) => {
	let statusDescription = "non si sa";

	if (guest?.status === "ci sono") {
		statusDescription = "è una brava persona";
	} else if (guest?.status === "non ci sono") {
		statusDescription = "è un super cattivo";
	}

	const presentCount = data.filter(
		(inv: Guest) => inv.status === "ci sono"
	).length;

	const mailOptions = {
		from: EMAIL,
		to: EMAIL,
		subject: "Aggiornamento Invitati",
		text: `Ecco il file JSON aggiornato degli invitati.\n\n${guest?.nome} ${
			guest?.cognome
		}: ${statusDescription}\n\nNote: ${
			guest?.note ?? "Nessuna"
		}\n\nNumero presenti aggiornato: ${presentCount}\n\n`,
		attachments: [
			{
				filename: "guests.json",
				content: JSON.stringify(data, null, 2),
			},
		],
	};

	transporter.sendMail(mailOptions, (error, info) => {
		if (error) return console.log(error);
		console.log("📨 Email inviata: " + info.response);
	});
};

// Endpoint per ottenere gli invitati
app.get("/guests", async (req, res) => {
	const guests = await readJsonFromDrive();
	res.json(guests);
});

// Endpoint per aggiornare lo stato di un invitato
app.post("/confirm", async (req, res) => {
	const { id, status, note } = req.body;
	let updatedGuests = await readJsonFromDrive();

	updatedGuests = updatedGuests.map((inv: Guest) =>
		inv.id === id ? { ...inv, status, note } : inv
	);

	await writeJsonToDrive(updatedGuests);

	sendEmail(
		updatedGuests,
		updatedGuests.find((inv: Guest) => inv.id === id)
	);

	res.json({ message: "Conferma aggiornata!", guests: updatedGuests });
});

app.listen(PORT, () => {
	console.log(`✅ Server in ascolto`);
});
