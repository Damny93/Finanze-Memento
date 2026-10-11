// ============================================================
// FINANZE
// MODULO CONTI
// FILE ESTERNO
// VERSIONE 0.12-C
// ============================================================
//
// BASE:
// Gestisci Conto estratto da finanze-dashboard.js v0.12-B
//
// SCOPO:
// - selettore Gestisci Conto
// - Archivia
// - Unisci
// - Elimina Tutto
// - Registro Eliminazioni collegato
//
// NESSUNA MODIFICA ALLA LOGICA VALIDATA.
//
// FUNZIONE PUBBLICA:
// FinanzeConti.apriGestisciConto(contexto)
//
// DIPENDENZA:
// finanze-core.js
// ============================================================

var FinanzeConti = (function() {

    var libConti = null;
    var libSaldo = null;
    var libTransazioni = null;
    var libSpeseFisse = null;
    var libEntrateFisse = null;
    var libSalvadanaio = null;
    var libMovimentiSalvadanaio = null;
    var libRegistro = null;

    var avviso = null;
    var ricalcolaSistemaCompleto = null;

    var arrotonda2 = null;
    var numero = null;
    var dueCifre = null;
    var formattaEuro = null;
    var pulisciElementi = null;
    var etichettaConto = null;

    var BLU = "#3F51B5";


    function testo(
        valore,
        dimensione,
        colore,
        stile
    ) {
        return ui()
            .text(
                String(valore)
            )
            .font({
                size: dimensione,
                color: colore,
                style: stile || "normal"
            });
    }


    function configura(contexto) {

        var ctx =
            contexto || {};

        libConti =
            ctx.libConti;

        libSaldo =
            ctx.libSaldo;

        libTransazioni =
            ctx.libTransazioni;

        libSpeseFisse =
            ctx.libSpeseFisse;

        libEntrateFisse =
            ctx.libEntrateFisse;

        libSalvadanaio =
            ctx.libSalvadanaio;

        libMovimentiSalvadanaio =
            ctx.libMovimentiSalvadanaio;

        libRegistro =
            ctx.libRegistro;

        avviso =
            ctx.avviso;

        ricalcolaSistemaCompleto =
            ctx.ricalcolaSistemaCompleto;


        if (
            typeof FinanzeCore ==
            "undefined"
        ) {
            throw (
                "finanze-core.js non disponibile."
            );
        }


        arrotonda2 =
            FinanzeCore.arrotonda2;

        numero =
            FinanzeCore.numero;

        dueCifre =
            FinanzeCore.dueCifre;

        formattaEuro =
            FinanzeCore.formattaEuro;
        pulisciElementi =
            FinanzeCore.pulisciElementi;

        etichettaConto =
            FinanzeCore.etichettaConto;
    }


    // 20. GESTISCI CONTO - SELETTORE
    // ========================================================

    function apriGestisciContoInterno() {

        if (
            !libConti ||
            !libRegistro ||
            !libMovimentiSalvadanaio
        ) {
            avviso(
                "Gestisci conto",
                "Una o più librerie necessarie non sono accessibili."
            );

            return true;
        }

        var tutti =
            libConti.entries();

        var elenco =
            [];

        var etichette =
            [];

        for (
            var i = 0;
            i < tutti.length;
            i++
        ) {
            var conto =
                tutti[i];

            if (
                !conto ||
                conto.deleted
            ) {
                continue;
            }

            elenco.push(
                conto
            );

            etichette.push(
                etichettaConto(
                    conto
                ) +
                (
                    conto.field(
                        "Attivo"
                    ) === true
                        ? " · ATTIVO"
                        : " · ARCHIVIATO"
                )
            );
        }

        if (
            elenco.length == 0
        ) {
            avviso(
                "Gestisci conto",
                "Non ci sono conti disponibili."
            );

            return true;
        }

        var scelta =
            ui()
            .choiceBox(
                0,
                etichette
            );

        dialog()
            .title(
                "⚙ Gestisci conto"
            )
            .view(
                ui()
                    .layout([

                        testo(
                            "SELEZIONA CONTO",
                            10,
                            BLU,
                            "bold"
                        ),

                        scelta

                    ])
            )
            .positiveButton(
                "APRI",
                function() {

                    var indice =
                        scelta.selected;

                    if (
                        indice < 0 ||
                        indice >=
                        elenco.length
                    ) {
                        return false;
                    }

                    mostraGestioneConto(
                        elenco[
                            indice
                        ]
                    );
                    return true;
                }
            )
            .negativeButton(
                "ANNULLA",
                function() {
                    return true;
                }
            )
            .show();

        return false;
    }


    // ========================================================
    // 21. GESTISCI CONTO - LOGICA
    // BASE: v0.7 COMPACT + CESTINO
    // ========================================================

    function mostraGestioneConto(
        conto
    ) {

        var nomeConto =
            String(
                conto.field(
                    "Nome Conto"
                ) ||
                "Conto senza nome"
            );

        var tipoConto =
            String(
                conto.field(
                    "Tipo di Conto"
                ) || ""
            );

        var istituto =
            String(
                conto.field(
                    "Istituto"
                ) || ""
            );

        var GC_NERO = "#000000";
        var GC_TITOLO = "#263238";
        var GC_BLU = "#1565C0";
        var GC_TESTO = "#424242";
        var GC_GRIGIO = "#757575";
        var GC_VERDE = "#2E7D32";
        var GC_ROSSO = "#C62828";
        var GC_ARANCIO = "#EF6C00";


        function gcTxt(
            valore,
            size,
            colore,
            stile
        ) {
            return ui()
                .text(
                    String(
                        valore
                    )
                )
                .font({
                    size: size,
                    color: colore,
                    style: stile || "normal"
                });
        }


        function gcGap(size) {
            return gcTxt(
                " ",
                size || 7,
                GC_NERO
            );
        }

        function gcLinea() {
            return gcTxt(
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
                11,
                GC_NERO,
                "bold"
            );
        }


        function gcTitolo(
            icona,
            valore
        ) {
            return gcTxt(
                icona +
                "  " +
                valore,
                16,
                GC_BLU,
                "bold"
            );
        }


        function gcRiga(
            valore,
            colore,
            size,
            stile
        ) {
            return ui()
                .layout([

                    gcTxt(
                        "┃",
                        size || 15,
                        GC_NERO,
                        "bold"
                    ),
                    gcTxt(
                        "  " +
                        valore,
                        size || 15,
                        colore || GC_TESTO,
                        stile || "normal"
                    )

                ])
                .horizontal();
        }


        function dipendenze(c) {
            return {
                transazioni:
                    pulisciElementi(
                        libTransazioni.linksTo(
                            c
                        )
                    ),
                check:
                    pulisciElementi(
                        libSaldo.linksTo(
                            c
                        )
                    ),
                spese:
                    pulisciElementi(
                        libSpeseFisse.linksTo(
                            c
                        )
                    ),
                entrate:
                    pulisciElementi(
                        libEntrateFisse.linksTo(
                            c
                        )
                    ),
                salvadanai:
                    pulisciElementi(
                        libSalvadanaio.linksTo(
                            c
                        )
                    )
            };
        }


        function movimentiSalvadanai(
            elencoSalvadanai
        ) {

            var risultato =
                [];

            var visti =
                {};

            for (
                var s = 0;
                s < elencoSalvadanai.length;
                s++
            ) {
                var mov =
                    pulisciElementi(
                        libMovimentiSalvadanaio.linksTo(
                            elencoSalvadanai[s]
                        )
                    );

                for (
                    var m = 0;
                    m < mov.length;
                    m++
                ) {
                    var id =
                        String(
                            mov[m].id || ""
                        );

                    if (
                        !visti[id]
                    ) {
                        visti[id] =
                            true;

                        risultato.push(
                            mov[m]
                        );
                    }
                }
            }

            return risultato;
        }


        function nomeRecord(
            record,
            tipo
        ) {

            var valore =
                "";

            if (
                tipo == "Conto"
            ) {
                valore =
                    record.field(
                        "Nome Conto"
                    );

            } else if (
                tipo == "Transazione"
            ) {
                valore =
                    record.field(
                        "Transazione"
                    );

            } else if (
                tipo == "Check Saldo"
            ) {
                valore =
                    record.field(
                        "Disponibilità Formattata"
                    ) ||
                    "Check Saldo";

            } else if (
                tipo == "Spesa Fissa"
            ) {
                valore =
                    record.field(
                        "Nome Spesa"
                    );

            } else if (
                tipo == "Entrata Fissa"
            ) {
                valore =
                    record.field(
                        "Entrata"
                    );
            } else if (
                tipo == "Salvadanaio"
            ) {
                valore =
                    record.field(
                        "Nome Salvadanaio"
                    );

            } else if (
                tipo ==
                "Movimento Salvadanaio"
            ) {
                valore =
                    record.field(
                        "Movimento"
                    ) ||
                    record.field(
                        "Tipo di Movimento"
                    );
            }
            valore =
                String(
                    valore || ""
                );

            if (
                valore == ""
            ) {
                valore =
                    tipo +
                    " #" +
                    String(
                        record.id || ""
                    );
            }

            return valore;
        }


        function generaIdOperazione() {

            var d =
                new Date();

            return (
                "DEL-" +
                d.getFullYear() +
                dueCifre(
                    d.getMonth() + 1
                ) +
                dueCifre(
                    d.getDate()
                ) +
                "-" +
                dueCifre(
                    d.getHours()
                ) +
                dueCifre(
                    d.getMinutes()
                ) +
                dueCifre(
                    d.getSeconds()
                ) +
                "-" +
                String(
                    conto.id || ""
                )
            );
        }


        function creaRigaRegistro(
            record,
            libreriaOrigine,
            tipoElemento,
            ordineRipristino,
            idOperazione,
            dataOperazione,
            nota
        ) {

            var rigaRegistro =
                libRegistro.create({

                    "Operazione":
                        "Eliminazione " +
                        nomeConto,

                    "ID Operazione":
                        idOperazione,

                    "Data e Ora":
                        dataOperazione,

                    "Tipo Operazione":
                        "ELIMINA CONTO",

                    "Stato Operazione":
                        "IN CORSO",

                    "Libreria Origine":
                        libreriaOrigine,
                    "Tipo Elemento":
                        tipoElemento,

                    "ID Elemento":
                        String(
                            record.id || ""
                        ),

                    "Nome Elemento":
                        nomeRecord(
                            record,
                            tipoElemento
                        ),

                    "ID Conto Padre":
                        String(
                            conto.id || ""
                        ),

                    "Nome Conto Padre":
                        nomeConto,

                    "Conto Attivo Prima":
                        (
                            tipoElemento ==
                            "Conto"
                                ? conto.field(
                                    "Attivo"
                                ) === true
                                : false
                        ),

                    "Ordine Ripristino":
                        ordineRipristino,

                    "Note Tecniche":
                        String(
                            nota || ""
                        )

                });
            if (!rigaRegistro) {
                throw (
                    "Impossibile creare Registro per " +
                    tipoElemento
                );
            }

            return rigaRegistro;
        }


        function cestinaRecord(
            record,
            rigaRegistro
        ) {

            if (!record) {
                throw (
                    "Record non valido."
                );
            }

            if (
                record.deleted
            ) {
                rigaRegistro.set(
                    "Stato Operazione",
                    "NEL CESTINO"
                );

                return;
            }

            record.trash();

            var libreriaOrigine =
                libByName(
                    String(
                        rigaRegistro.field(
                            "Libreria Origine"
                        ) || ""
                    )
                );

            var idElemento =
                String(
                    rigaRegistro.field(
                        "ID Elemento"
                    ) || ""
                );

            var verifica =
                libreriaOrigine
                    ? libreriaOrigine.findById(
                        idElemento
                    )
                    : null;

            if (
                verifica &&
                verifica.deleted === true
            ) {
                rigaRegistro.set(
                    "Stato Operazione",
                    "NEL CESTINO"
                );

                return;
            }

            rigaRegistro.set(
                "Stato Operazione",
                "ERRORE"
            );

            rigaRegistro.set(
                "Note Tecniche",
                "ERRORE: trash() eseguito ma deleted non verificato."
            );

            throw (
                "Impossibile verificare il cestinamento di " +
                idElemento
            );
        }


        var dep =
            dipendenze(
                conto
            );

        var movimenti =
            movimentiSalvadanai(
                dep.salvadanai
            );

        var saldoAttuale =
            arrotonda2(
                conto.field(
                    "Saldo Attuale"
                )
            );

        var saldoDisponibile =
            arrotonda2(
                conto.field(
                    "Saldo Disponibile"
                )
            );

        var saldoIniziale =
            arrotonda2(
                conto.field(
                    "Saldo Iniziale"
                )
            );

        var dataSaldoIniziale =
            conto.field(
                "Data Saldo Iniziale"
            );

        var fido =
            arrotonda2(
                conto.field(
                    "Fido"
                )
            );

        var attivo =
            conto.field(
                "Attivo"
            );

        var totaleEntrate =
            0;

        var totaleUscite =
            0;

        for (
            var t = 0;
            t < dep.transazioni.length;
            t++
        ) {
            var tr =
                dep.transazioni[t];

            var valore =
                Math.abs(
                    numero(
                        tr.field(
                            "Importo"
                        )
                    )
                );

            if (
                tr.field(
                    "Tipo"
                ) ==
                "Entrata"
            ) {
                totaleEntrate +=
                    valore;
            }
            if (
                tr.field(
                    "Tipo"
                ) ==
                "Uscita"
            ) {
                totaleUscite +=
                    valore;
            }
        }

        totaleEntrate =
            arrotonda2(
                totaleEntrate
            );

        totaleUscite =
            arrotonda2(
                totaleUscite
            );
        var riserva =
            0;

        for (
            var rs = 0;
            rs < dep.salvadanai.length;
            rs++
        ) {
            riserva +=
                numero(
                    dep.salvadanai[rs].field(
                        "Importo Effettivo"
                    )
                );
        }

        riserva =
            arrotonda2(
                riserva
            );

        function archiviaConto() {

            if (
                attivo !== true
            ) {
                avviso(
                    "📦 Conto già archiviato",
                    nomeConto +
                    " risulta già archiviato."
                );

                return;
            }

            var bloccoSaldo =
                Math.abs(
                    saldoAttuale) >= 0.01;

            var bloccoSpese =
                dep.spese.length > 0;

            var bloccoEntrate =
                dep.entrate.length > 0;

            var bloccoRiserva =
                Math.abs(
                    riserva
                ) >= 0.01;

            if (
                bloccoSaldo ||
                bloccoSpese ||
                bloccoEntrate ||
                bloccoRiserva
            ) {
                var elementi =
                    [

                        gcTxt(
                            "⛔ ARCHIVIAZIONE NON DISPONIBILE",
                            17,
                            GC_ROSSO,
                            "bold"
                        ),

                        gcGap(5),

                        gcTxt(
                            "🏦 " +
                            nomeConto,
                            18,
                            GC_TITOLO,
                            "bold"
                        ),

                        gcGap(7),

                        gcLinea()

                    ];

                if (bloccoSaldo) {
                    elementi.push(
                        gcRiga(
                            "❌ Saldo da azzerare",
                            GC_ROSSO,
                            15,
                            "bold"
                        )
                    );

                    elementi.push(
                        gcRiga(
                            formattaEuro(
                                saldoAttuale
                            ),
                            GC_ROSSO,
                            14
                        )
                    );
                }

                if (bloccoSpese) {
                    elementi.push(
                        gcRiga(
                            "❌ Spese Fisse da gestire: " +
                            dep.spese.length,
                            GC_ROSSO,
                            14
                        )
                    );
                }

                if (bloccoEntrate) {
                    elementi.push(
                        gcRiga(
                            "❌ Entrate Fisse da gestire: " +
                            dep.entrate.length,
                            GC_ROSSO,
                            14
                        )
                    );
                }
                if (bloccoRiserva) {
                    elementi.push(
                        gcRiga(
                            "❌ Riserva: " +
                            formattaEuro(
                                riserva
                            ),
                            GC_ARANCIO,
                            14
                        )
                    );
                }

                elementi.push(
                    gcLinea()
                );

                dialog()
                    .title(
                        "Archivia conto"
                    )
                    .view(
                        ui()
                            .layout(
                                elementi
                            )
                    )
                    .positiveButton(
                        "OK",
                        function() {
                            return true;
                        }
                    )
                    .show();

                return;
            }

            dialog()
                .title(
                    "📦 Conferma archiviazione"
                )
                .text(
                    nomeConto +
                    "\n\n" +
                    "Saldo: " +
                    formattaEuro(
                        saldoAttuale
                    ) +
                    "\n" +
                    "Spese Fisse: 0\n" +
                    "Entrate Fisse: 0\n" +
                    "Riserva: " +
                    formattaEuro(
                        riserva
                    )
                )
                .negativeButton(
                    "ANNULLA",
                    function() {
                        return true;
                    }
                )
                .positiveButton(
                    "ARCHIVIA",
                    function() {

                        try {
                            conto.set(
                                "Attivo",
                                false
                            );

                            ricalcolaSistemaCompleto();

                            avviso(
                                "Conto archiviato",
                                nomeConto
                            );

                        } catch (
                            err
                        ) {
                            avviso(
                                "Errore archiviazione",
                                String(err)
                            );
                        }

                        return true;
                    }
                )
                .show();
        }


        function spostaRelazioni(
            elenco,
            destinazione
        ) {
            for (
                var i = 0;
                i < elenco.length;
                i++
            ) {
                elenco[i].set(
                    "Conto",
                    [
                        destinazione
                    ]
                );
            }
        }


        function eseguiUnione(
            destinazione
        ) {

            try {
                var d =
                    dipendenze(
                        destinazione
                    );

                if (
                    d.transazioni.length > 0 ||
                    d.check.length > 0 ||
                    d.spese.length > 0 ||
                    d.entrate.length > 0 ||
                    d.salvadanai.length > 0 ||
                    Math.abs(
                        numero(
                            destinazione.field(
                                "Saldo Iniziale"
                            )
                        )
                    ) >= 0.01 ||
                    Math.abs(
                        numero(
                            destinazione.field(
                                "Saldo Attuale"
                            )
                        )
                    ) >= 0.01
                ) {
                    throw (
                        "La destinazione non è più vuota."
                    );
                }

                destinazione.set(
                    "Saldo Iniziale",
                    saldoIniziale
                );

                if (
                    dataSaldoIniziale
                ) {
                    destinazione.set(
                        "Data Saldo Iniziale",
                        dataSaldoIniziale
                    );
                }

                destinazione.set(
                    "Fido",
                    fido
                );

                spostaRelazioni(
                    dep.transazioni,
                    destinazione
                );

                spostaRelazioni(
                    dep.check,
                    destinazione
                );

                spostaRelazioni(
                    dep.spese,
                    destinazione
                );

                spostaRelazioni(
                    dep.entrate,
                    destinazione
                );

                spostaRelazioni(
                    dep.salvadanai,
                    destinazione
                );

                var residui =
                    dipendenze(
                        conto
                    );

                var totaleResidui =
                    residui.transazioni.length +
                    residui.check.length +
                    residui.spese.length +
                    residui.entrate.length +
                    residui.salvadanai.length;

                if (
                    totaleResidui > 0
                ) {
                    throw (
                        "Migrazione incompleta. Relazioni residue: " +
                        totaleResidui
                    );
                }

                conto.set(
                    "Attivo",
                    false
                );

                conto.set(
                    "Saldo Iniziale",
                    0
                );

                conto.set(
                    "Fido",
                    0
                );
                conto.set(
                    "Saldo Attuale",
                    0
                );

                conto.set(
                    "Saldo Disponibile",
                    0
                );

                ricalcolaSistemaCompleto();

                avviso(
                    "✅ Unione completata",
                    nomeConto +
                    " → " +
                    String(
                        destinazione.field(
                            "Nome Conto"
                        ) ||
                        "Destinazione"
                    )
                );

            } catch (
                err
            ) {
                avviso(
                    "⛔ Unione interrotta",
                    String(err) +
                    "\n\nNon eliminare nessun conto."
                );
            }
        }


        function mostraAnteprimaUnione(
            destinazione
        ) {

            var d =
                dipendenze(
                    destinazione
                );

            var saldoInizialeDest =
                numero(
                    destinazione.field(
                        "Saldo Iniziale"
                    )
                );

            var saldoAttualeDest =
                numero(
                    destinazione.field(
                        "Saldo Attuale"
                    )
                );

            var vuota =
                (
                    d.transazioni.length == 0 &&
                    d.check.length == 0 &&
                    d.spese.length == 0 &&
                    d.entrate.length == 0 &&
                    d.salvadanai.length == 0 &&
                    Math.abs(
                        saldoInizialeDest
                    ) < 0.01 &&
                    Math.abs(
                        saldoAttualeDest
                    ) < 0.01
                );

            var nomeDest =
                String(
                    destinazione.field(
                        "Nome Conto"
                    ) ||
                    "Senza nome"
                );

            if (!vuota) {
                avviso(
                    "⛔ Destinazione non vuota",
                    nomeDest +
                    "\n\nLa destinazione deve essere completamente vuota."
                );

                return;
            }

            dialog()
                .title(
                    "🔁 Anteprima unione"
                )
                .text(
                    nomeConto +
                    "\n↓\n" +
                    nomeDest +
                    "\n\n" +
                    "Saldo iniziale: " +
                    formattaEuro(
                        saldoIniziale
                    ) +
                    "\n" +
                    "Fido: " +
                    formattaEuro(
                        fido
                    ) +
                    "\n" +
                    "Transazioni: " +
                    dep.transazioni.length +
                    "\n" +
                    "Check: " +
                    dep.check.length +
                    "\n" +
                    "Spese Fisse: " +
                    dep.spese.length +
                    "\n" +
                    "Entrate Fisse: " +
                    dep.entrate.length +
                    "\n" +
                    "Salvadanai: " +
                    dep.salvadanai.length
                )
                .negativeButton(
                    "ANNULLA",
                    function() {
                        return true;
                    }
                )
                .positiveButton(
                    "CONFERMA",
                    function() {
                        eseguiUnione(
                            destinazione
                        );

                        return true;
                    }
                )
                .show();
        }


        function unisciConto() {

            if (
                attivo !== true
            ) {
                avviso(
                    "⛔ Unione non disponibile",
                    "Il conto sorgente è già archiviato."
                );

                return;
            }

            var tutti =
                libConti.entries();

            var destinazioni =
                [];

            var etichette =
                [];
            for (
                var i = 0;
                i < tutti.length;
                i++
            ) {
                var c =
                    tutti[i];

                if (
                    !c ||
                    c.deleted ||
                    String(c.id) ==
                        String(conto.id) ||
                    c.field(
                        "Attivo"
                    ) !== true
                ) {
                    continue;
                }

                destinazioni.push(
                    c
                );

                etichette.push(
                    etichettaConto(
                        c
                    )
                );
            }

            if (
                destinazioni.length == 0
            ) {
                avviso(
                    "Unisci conto",
                    "Nessun altro conto attivo disponibile."
                );

                return;
            }
            var scelta =
                ui()
                .choiceBox(
                    0,
                    etichette
                );

            dialog()
                .title(
                    "🔁 Seleziona destinazione"
                )
                .view(
                    ui()
                        .layout([

                            gcTxt(
                                "SORGENTE",
                                12,
                                GC_GRIGIO,
                                "bold"
                            ),

                            gcTxt(
                                nomeConto,
                                17,
                                GC_TITOLO,
                                "bold"
                            ),

                            gcGap(5),

                            gcTxt(
                                "DESTINAZIONE",
                                12,
                                GC_BLU,
                                "bold"
                            ),

                            scelta

                        ])
                )
                .negativeButton(
                    "ANNULLA",
                    function() {
                        return true;
                    }
                )
                .positiveButton(
                    "ANTEPRIMA",
                    function() {

                        var indice =
                            scelta.selected;

                        if (
                            indice < 0 ||
                            indice >=
                            destinazioni.length
                        ) {
                            return false;
                        }
                        mostraAnteprimaUnione(
                            destinazioni[
                                indice
                            ]
                        );

                        return true;
                    }
                )
                .show();
        }


        function eliminaTuttoConto() {

            var totaleElementi =
                1 +
                dep.transazioni.length +
                dep.check.length +
                dep.spese.length +
                dep.entrate.length +
                dep.salvadanai.length +
                movimenti.length;

            dialog()
                .title(
                    "🗑 Anteprima eliminazione"
                )
                .text(
                    nomeConto +
                    "\n\n" +
                    "Conto: 1\n" +
                    "Transazioni: " +
                    dep.transazioni.length +
                    "\n" +
                    "Check Saldo: " +
                    dep.check.length +
                    "\n" +
                    "Spese Fisse: " +
                    dep.spese.length +
                    "\n" +
                    "Entrate Fisse: " +
                    dep.entrate.length +
                    "\n" +
                    "Salvadanai: " +
                    dep.salvadanai.length +
                    "\n" +
                    "Movimenti Salvadanaio: " +
                    movimenti.length +
                    "\n\nTotale: " +
                    totaleElementi +
                    "\n\n" +
                    "Tutto verrà spostato nel Cestino nativo."
                )
                .negativeButton(
                    "ANNULLA",
                    function() {
                        return true;
                    }
                )
                .positiveButton(
                    "CONTINUA",
                    function() {
                        confermaEliminazione();
                        return true;
                    }
                )
                .show();
        }


        function confermaEliminazione() {
            dialog()
                .title(
                    "⚠ Conferma cestinamento"
                )
                .text(
                    "Tutti i dati di " +
                    nomeConto +
                    " verranno spostati nel Cestino.\n\n" +
                    "Nessuna cancellazione definitiva."
                )
                .negativeButton(
                    "ANNULLA",
                    function() {
                        return true;
                    }
                )
                .positiveButton(
                    "SPOSTA NEL CESTINO",
                    function() {
                        eseguiEliminazione();
                        return true;
                    }
                )
                .show();
        }


        function eseguiEliminazione() {

            var idOperazione =
                generaIdOperazione();

            var dataOperazione =
                new Date()
                    .getTime();

            var registriMovimenti =
                [];

            var registriSalvadanai =
                [];

            var registriEntrate =
                [];

            var registriSpese =
                [];

            var registriCheck =
                [];

            var registriTransazioni =
                [];
            var registroConto =
                null;

            try {

                for (
                    var m = 0;
                    m < movimenti.length;
                    m++
                ) {
                    registriMovimenti.push(
                        creaRigaRegistro(
                            movimenti[m],
                            "[■] Movimenti Salvadanaio",
                            "Movimento Salvadanaio",
                            70,
                            idOperazione,
                            dataOperazione,
                            "Eliminazione collegata al Conto " +
                            nomeConto
                        )
                    );
                }

                for (
                    var sv = 0;
                    sv < dep.salvadanai.length;
                    sv++
                ) {
                    registriSalvadanai.push(
                        creaRigaRegistro(
                            dep.salvadanai[sv],
                            "[■] Salvadanaio",
                            "Salvadanaio",
                            60,
                            idOperazione,
                            dataOperazione,
                            ""
                        )
                    );
                }
                for (
                    var en = 0;
                    en < dep.entrate.length;
                    en++
                ) {
                    registriEntrate.push(
                        creaRigaRegistro(
                            dep.entrate[en],
                            "[■] Entrate Fisse",
                            "Entrata Fissa",
                            50,
                            idOperazione,
                            dataOperazione,
                            ""
                        )
                    );
                }

                for (
                    var sp = 0;
                    sp < dep.spese.length;
                    sp++
                ) {
                    registriSpese.push(
                        creaRigaRegistro(
                            dep.spese[sp],
                            "[■] Spese Fisse",
                            "Spesa Fissa",
                            40,
                            idOperazione,
                            dataOperazione,
                            ""
                        )
                    );
                }

                for (
                    var ck = 0;
                    ck < dep.check.length;
                    ck++
                ) {
                    registriCheck.push(
                        creaRigaRegistro(
                            dep.check[ck],
                            "[■] Saldo",
                            "Check Saldo",
                            30,
                            idOperazione,
                            dataOperazione,
                            ""
                        )
                    );
                }

                for (
                    var tr = 0;
                    tr < dep.transazioni.length;
                    tr++
                ) {
                    registriTransazioni.push(
                        creaRigaRegistro(
                            dep.transazioni[tr],
                            "[■] Transazioni",
                            "Transazione",
                            20,
                            idOperazione,
                            dataOperazione,
                            ""
                        )
                    );
                }

                registroConto =
                    creaRigaRegistro(
                        conto,
                        "[■] Conti",
                        "Conto",
                        10,
                        idOperazione,
                        dataOperazione,
                        ""
                    );

                for (
                    var cm = 0;
                    cm < movimenti.length;
                    cm++
                ) {
                    cestinaRecord(
                        movimenti[cm],
                        registriMovimenti[cm]
                    );
                }

                for (
                    var cs = 0;
                    cs < dep.salvadanai.length;
                    cs++
                ) {
                    cestinaRecord(
                        dep.salvadanai[cs],
                        registriSalvadanai[cs]
                    );
                }
                for (
                    var ce = 0;
                    ce < dep.entrate.length;
                    ce++
                ) {
                    cestinaRecord(
                        dep.entrate[ce],
                        registriEntrate[ce]
                    );
                }

                for (
                    var csp = 0;
                    csp < dep.spese.length;
                    csp++
                ) {
                    cestinaRecord(
                        dep.spese[csp],
                        registriSpese[csp]
                    );
                }

                for (
                    var cc = 0;
                    cc < dep.check.length;
                    cc++
                ) {
                    cestinaRecord(
                        dep.check[cc],
                        registriCheck[cc]
                    );
                }

                for (
                    var ct = 0;
                    ct < dep.transazioni.length;
                    ct++
                ) {
                    cestinaRecord(
                        dep.transazioni[ct],
                        registriTransazioni[ct]
                    );
                }

                cestinaRecord(
                    conto,
                    registroConto
                );

                ricalcolaSistemaCompleto();

                avviso(
                    "♻ Eliminazione completata",
                    "Operazione:\n" +
                    idOperazione +
                    "\n\n" +
                    "Tutti gli elementi sono recuperabili dal Cestino."
                );

            } catch (
                errore
            ) {
                avviso(
                    "⛔ Eliminazione interrotta",
                    "Operazione:\n" +
                    idOperazione +
                    "\n\n" +
                    String(
                        errore
                    ) +
                    "\n\n" +
                    "NON modificare il Registro Eliminazioni."
                );
            }
        }


        var header =
            ui()
            .layout([

                gcTxt(
                    "🏦 " +
                    nomeConto,
                    22,
                    GC_TITOLO,
                    "bold"
                ),

                gcTxt(
                    (
                        tipoConto ||
                        "Conto"
                    ) +
                    (
                        istituto
                            ? " • " +
                              istituto
                            : ""
                    ),
                    14,
                    GC_GRIGIO
                ),

                gcTxt(
                    attivo === true
                        ? "● ATTIVO"
                        : "● ARCHIVIATO",
                    14,
                    attivo === true
                        ? GC_VERDE
                        : GC_GRIGIO,
                    "bold"
                )

            ]);


        var bloccoConto =
            ui()
            .layout([

                gcTitolo(
                    "💰",
                    "DATI CONTO"
                ),

                gcLinea(),

                gcRiga(
                    "Saldo attuale  ➜  " +
                    formattaEuro(
                        saldoAttuale
                    )
                ),gcRiga(
                    "Disponibile  ➜  " +
                    formattaEuro(
                        saldoDisponibile
                    )
                ),

                gcRiga(
                    "Fido  ➜  " +
                    formattaEuro(
                        fido
                    )
                ),

                gcLinea()

            ]);


        var bloccoCollegati =
            ui()
            .layout([

                gcTitolo(
                    "📊",
                    "DATI COLLEGATI"
                ),

                gcLinea(),

                gcRiga(
                    "Transazioni  ➜  " +
                    dep.transazioni.length
                ),

                gcRiga(
                    "↳ Entrate  " +
                    formattaEuro(
                        totaleEntrate
                    ),
                    GC_VERDE,
                    14
                ),

                gcRiga(
                    "↳ Uscite  " +
                    formattaEuro(
                        totaleUscite
                    ),
                    GC_ROSSO,
                    14
                ),

                gcRiga(
                    "Check Saldo  ➜  " +
                    dep.check.length
                ),

                gcRiga(
                    "Spese Fisse  ➜  " +
                    dep.spese.length
                ),

                gcRiga(
                    "Entrate Fisse  ➜  " +
                    dep.entrate.length
                ),

                gcRiga(
                    "Salvadanai  ➜  " +
                    dep.salvadanai.length
                ),

                gcRiga(
                    "↳ Riserva  " +
                    formattaEuro(
                        riserva
                    ),
                    GC_ARANCIO,
                    14
                ),

                gcRiga(
                    "Movimenti salvadanaio  ➜  " +
                    movimenti.length
                ),

                gcLinea()

            ]);


        dialog()
            .title(
                "Gestisci conto"
            )
            .view(
                ui()
                    .layout([

                        header,

                        gcGap(9),

                        bloccoConto,

                        gcGap(12),

                        bloccoCollegati,

                        gcGap(12),

                        gcTxt(
                            "⚙ GESTIONE",
                            16,
                            GC_BLU,
                            "bold"
                        ),

                        gcLinea(),

                        gcRiga(
                            "📦 ARCHIVIA",
                            GC_VERDE,
                            15,
                            "bold"
                        ),

                        gcRiga(
                            "🔁 UNISCI",
                            GC_BLU,
                            15,
                            "bold"
                        ),

                        gcRiga(
                            "🗑 ELIMINA TUTTO",
                            GC_ROSSO,
                            15,
                            "bold"
                        ),

                        gcLinea()

                    ])
            )
            .positiveButton(
                "📦 ARCHIVIA",
                function() {
                    archiviaConto();
                    return true;
                }
            )
            .neutralButton(
                "🔁 UNISCI",
                function() {
                    unisciConto();
                    return true;
                }
            )
            .negativeButton(
                "🗑 ELIMINA",
                function() {
                    eliminaTuttoConto();
                    return true;
                }
            )
            .show();
    }


    // ========================================================

    return {

        versione:
            "0.12-C",

        apriGestisciConto:
            function(contexto) {
                try {

                    configura(
                        contexto
                    );

                    return apriGestisciContoInterno();

                } catch (errore) {

                    if (
                        contexto &&
                        typeof contexto.avviso ==
                        "function"
                    ) {
                        contexto.avviso(
                            "Gestisci conto",
                            String(errore)
                        );

                    } else {
                        dialog()
                            .title(
                                "Gestisci conto"
                            )
                            .text(
                                String(errore)
                            )
                            .positiveButton(
                                "OK",
                                function() {
                                    return true;
                                }
                            )
                            .show();
                    }

                    return true;
                }
            }

    };

})();