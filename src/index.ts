import cors from "cors";
import express from "express";
import fs from "fs";
import nodemailer from "nodemailer";

const app = express();
const PORT = 3001;
const FILE_PATH = "./src/invitati.json";
const EMAIL = "lorenzopagani012@gmail.com";

app.use(express.json());
app.use(cors());

type Status = "ci sono" | "non ci sono" | null;

// Tipi per TypeScript
interface Invitato {
	id: number;
	nome: string;
	cognome: string;
	status: Status;
}

// Leggere gli invitati dal file JSON
const leggiInvitati = (): Invitato[] => {
	return JSON.parse(fs.readFileSync(FILE_PATH, "utf8"));
};

// Scrivere gli invitati nel file JSON
const scriviInvitati = (data: Invitato[]) => {
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
const inviaEmail = (data: Invitato[], invitato?: Invitato) => {
	const mailOptions = {
		from: EMAIL,
		to: EMAIL,
		subject: "Aggiornamento Invitati",
		text: `Ecco il file JSON aggiornato degli invitati.\n\n${invitato?.nome} ${
			invitato?.cognome
		}: ${
			!invitato?.status
				? "non si sa"
				: invitato?.status === "ci sono"
				? "è una brava persona"
				: "è un super cattivo"
		}`,
		attachments: [
			{
				filename: "invitati.json",
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
app.get("/invitati", (req, res) => {
	res.json(leggiInvitati());
});

// Endpoint per aggiornare lo stato di un invitato
app.post("/conferma", (req, res) => {
	const { id, status, note } = req.body;
	let invitatiAggiornati = leggiInvitati();

	invitatiAggiornati = invitatiAggiornati.map((inv) =>
		inv.id === id ? { ...inv, status, note } : inv
	);

	scriviInvitati(invitatiAggiornati);
	inviaEmail(
		invitatiAggiornati,
		invitatiAggiornati.find((inv) => inv.id === id)
	);
	res.json({ message: "Conferma aggiornata!", invitati: invitatiAggiornati });
});

// Avvia il server
app.listen(PORT, () => {
	console.log(`✅ Server in ascolto su http://localhost:${PORT}`);
});
