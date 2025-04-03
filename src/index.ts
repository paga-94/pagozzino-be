import cors from "cors";
import express from "express";
import fs from "fs";
import nodemailer from "nodemailer";

const app = express();
const PORT = 3001;
const FILE_PATH = "./src/guests.json";
const EMAIL = "lorenzopagani012@gmail.com";

app.use(express.json());
app.use(cors());

type Status = "ci sono" | "non ci sono" | null;

// Tipi per TypeScript
interface Guest {
	id: number;
	nome: string;
	cognome: string;
	status: Status;
}

// Leggere gli invitati dal file JSON
const readGuests = (): Guest[] => {
	return JSON.parse(fs.readFileSync(FILE_PATH, "utf8"));
};

// Scrivere gli invitati nel file JSON
const writeGuests = (data: Guest[]) => {
	fs.writeFileSync(FILE_PATH, JSON.stringify(data, null, 2));
};

// Configura il trasporto email
const transporter = nodemailer.createTransport({
	service: "gmail",
	auth: {
		user: EMAIL,
		pass: "zdin eqqs guwv wjmk",
	},
});

// Funzione per inviare l'email
const sendEmail = (data: Guest[], guest?: Guest) => {
	let statusDescription = "non si sa";

	if (guest?.status === "ci sono") {
		statusDescription = "è una brava persona";
	} else if (guest?.status === "non ci sono") {
		statusDescription = "è un super cattivo";
	}

	const mailOptions = {
		from: EMAIL,
		to: EMAIL,
		subject: "Aggiornamento Invitati",
		text: `Ecco il file JSON aggiornato degli invitati.\n\n${guest?.nome} ${guest?.cognome}: ${statusDescription}\n\n`,
		attachments: [
			{
				filename: "guests.json",
				content: JSON.stringify(data, null, 2),
			},
		],
	};

	transporter.sendMail(mailOptions, (error, info) => {
		if (error) {
			return console.log(error);
		}
		console.log("Email inviata: " + info.response);
	});
};

// Endpoint per ottenere gli invitati
app.get("/guests", (req, res) => {
	res.json(readGuests());
});

// Endpoint per aggiornare lo stato di un invitato
app.post("/confirm", (req, res) => {
	const { id, status, note } = req.body;
	let updatedGuests = readGuests();

	updatedGuests = updatedGuests.map((inv) =>
		inv.id === id ? { ...inv, status, note } : inv
	);

	writeGuests(updatedGuests);
	sendEmail(
		updatedGuests,
		updatedGuests.find((inv) => inv.id === id)
	);
	res.json({ message: "Conferma aggiornata!", guests: updatedGuests });
});

// Avvia il server
app.listen(PORT, () => {
	console.log(`✅ Server in ascolto`);
});
