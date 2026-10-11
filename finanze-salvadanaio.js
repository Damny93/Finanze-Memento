// ============================================================
// FINANZE
// MODULO SALVADANAIO
// FILE ESTERNO
// VERSIONE 0.12-D
// ============================================================
//
// BASE:
// Nuovo Salvadanaio estratto da finanze-dashboard.js v0.12-C
//
// SCOPO:
// - scelta modalità
// - Fisso
// - Importo
// - Percentuale
// - Manuale
// - Entrata di Riferimento
// - creazione record Salvadanaio
// - collegamento al Conto
// - ricalcolo Salvadanaio
//
// NESSUNA MODIFICA ALLA LOGICA VALIDATA.
//
// FUNZIONE PUBBLICA:
// FinanzeSalvadanaio.apriNuovoSalvadanaio(contexto)
//
// DIPENDENZE:
// - finanze-core.js
// - finanze-motore.js
// ============================================================

var FinanzeSalvadanaio = (function() {

    var libEntrateFisse = null;
    var libSalvadanaio = null;

    var contiAttivi = null;
    var avviso = null;

    var arrotonda2 = null;
    var parseImporto = null;
    var relazioni = null;
    var etichettaConto = null;

    var TESTO = "#222222";
    var SECONDARIO = "#777777";
    var BLU = "#3F51B5";


    // ========================================================
    // 1. UI BASE
    // ========================================================

    function testo(
        valore,
        dimensione,
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
                size: dimensione,
                color: colore,
                style: stile || "normal"
            });
    }


    function spazio(
        altezza
    ) {
        return ui()
            .text("")
            .height(
                altezza
            );
    }

    // ========================================================
    // 2. CONFIGURA CONTESTO
    // ========================================================

    function configura(
        contexto
    ) {

        var ctx =
            contexto || {};

        libEntrateFisse =
            ctx.libEntrateFisse;

        libSalvadanaio =
            ctx.libSalvadanaio;

        contiAttivi =
            ctx.contiAttivi;

        avviso =
            ctx.avviso;


        if (
            typeof FinanzeCore ==
            "undefined"
        ) {
            throw (
                "finanze-core.js non disponibile."
            );
        }


        if (
            typeof contiAttivi !=
            "function"
        ) {
            throw (
                "contiAttivi() non disponibile."
            );
        }


        if (
            typeof avviso !=
            "function"
        ) {
            throw (
                "avviso() non disponibile."
            );
        }


        arrotonda2 =
            FinanzeCore.arrotonda2;

        parseImporto =
            FinanzeCore.parseImporto;

        relazioni =
            FinanzeCore.relazioni;
        etichettaConto =
            FinanzeCore.etichettaConto;
    }


    // ========================================================
    // 3. NUOVO SALVADANAIO - STEP 1
    // ========================================================

    function apriNuovoSalvadanaioInterno() {

        if (!libSalvadanaio) {
            avviso(
                "Nuovo Salvadanaio",
                "La libreria [■] Salvadanaio non è accessibile."
            );

            return true;
        }

        var opzioniModalita =
            [
                "Fisso",
                "Importo",
                "Percentuale",
                "Manuale"
            ];


        var sceltaModalita =
            ui()
            .choiceBox(
                0,
                opzioniModalita
            );


        var vista =
            ui()
            .layout([
                testo(
                    "MODALITÀ",
                    11,
                    BLU,
                    "bold"
                ),

                sceltaModalita,

                spazio(7),

                testo(
                    "Fisso",
                    10,
                    TESTO,
                    "bold"
                ),

                testo(
                    "Riserva iniziale senza regola automatica.",
                    9,
                    SECONDARIO
                ),

                spazio(5),

                testo(
                    "Importo",
                    10,
                    TESTO,
                    "bold"
                ),

                testo(
                    "Accantona un importo fisso da un'Entrata Fissa.",
                    9,
                    SECONDARIO
                ),

                spazio(5),

                testo(
                    "Percentuale",
                    10,
                    TESTO,
                    "bold"
                ),

                testo(
                    "Accantona una percentuale di un'Entrata Fissa.",
                    9,
                    SECONDARIO
                ),

                spazio(5),

                testo(
                    "Manuale",
                    10,
                    TESTO,
                    "bold"
                ),
                testo(
                    "Nessuna regola automatica di accantonamento.",
                    9,
                    SECONDARIO
                )

            ])
            .width_match_parent();


        dialog()
            .title(
                "＋ Nuovo Salvadanaio"
            )
            .view(vista)
            .positiveButton(
                "CONTINUA",
                function() {

                    var indice =
                        sceltaModalita.selected;


                    var modalita =
                        opzioniModalita[
                            indice
                        ];


                    if (!modalita) {
                        return false;
                    }


                    apriDatiNuovoSalvadanaio(
                        modalita
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
    // 4. NUOVO SALVADANAIO - STEP 2
    // ========================================================

    function apriDatiNuovoSalvadanaio(
        modalita
    ) {
        var listaConti =
            contiAttivi();


        if (
            listaConti.length == 0
        ) {
            avviso(
                "Nuovo Salvadanaio",
                "Non ci sono conti attivi."
            );

            return;
        }


        var opzioniConti = [];


        for (
            var i = 0;
            i < listaConti.length;
            i++
        ) {
            opzioniConti.push(
                etichettaConto(
                    listaConti[i]
                )
            );
        }


        var sceltaConto =
            ui()
            .choiceBox(
                0,
                opzioniConti
            );


        var campoNome =
            ui()
            .edit("");


        var campoImportoIniziale =
            ui()
            .edit("0");


        var elementi =
            [

                testo(
                    "MODALITÀ",
                    10,
                    BLU,
                    "bold"
                ),

                testo(
                    modalita,
                    14,
                    TESTO,
                    "bold"
                ),

                spazio(8),

                testo(
                    "CONTO",
                    10,
                    BLU,
                    "bold"
                ),

                sceltaConto,

                spazio(6),

                testo(
                    "NOME SALVADANAIO",
                    10,
                    BLU,
                    "bold"
                ),

                campoNome,

                spazio(6),

                testo(
                    "IMPORTO INIZIALE (€)",
                    10,
                    BLU,
                    "bold"
                ),

                campoImportoIniziale

            ];


        var richiedeRegola =
            (
                modalita == "Importo" ||
                modalita == "Percentuale"
            );


        var campoValoreRegola =
            null;


        var sceltaEntrata =
            null;


        var riferimentiEntrate =
            [];


        if (
            richiedeRegola
        ) {
            campoValoreRegola =
                ui()
                .edit("");


            var entrate =
                libEntrateFisse
                    ? libEntrateFisse.entries()
                    : [];


            var opzioniEntrate =
                [];


            for (
                var e = 0;
                e < entrate.length;
                e++
            ) {
                var entrata =
                    entrate[e];


                if (
                    !entrata ||
                    entrata.deleted
                ) {
                    continue;
                }


                riferimentiEntrate.push(
                    entrata
                );


                var nomeEntrata =
                    String(
                        entrata.field(
                            "Entrata"
                        ) || "Entrata"
                    );


                var relConto =
                    relazioni(
                        entrata.field(
                            "Conto"
                        )
                    );


                if (
                    relConto.length > 0
                ) {
                    nomeEntrata +=
                        " · " +
                        etichettaConto(
                            relConto[0]
                        );
                }


                opzioniEntrate.push(
                    nomeEntrata
                );
            }


            sceltaEntrata =
                ui()
                .choiceBox(
                    0,
                    opzioniEntrate
                );


            elementi.push(
                spazio(6)
            );

            elementi.push(
                testo(
                    modalita == "Percentuale"
                        ? "PERCENTUALE DA ACCANTONARE (%)"
                        : "IMPORTO DA ACCANTONARE (€)",
                    10,
                    BLU,
                    "bold"
                )
            );


            elementi.push(
                campoValoreRegola
            );


            elementi.push(
                spazio(6)
            );

            elementi.push(
                testo(
                    "ENTRATA DI RIFERIMENTO",
                    10,
                    BLU,
                    "bold"
                )
            );


            elementi.push(
                sceltaEntrata
            );
        }


        dialog()
            .title(
                "＋ Salvadanaio · " +
                modalita
            )
            .view(
                ui()
                .layout(
                    elementi
                )
                .width_match_parent()
            )
            .positiveButton(
                "REGISTRA",
                function() {

                    var indiceConto =
                        sceltaConto.selected;


                    if (
                        indiceConto < 0 ||
                        indiceConto >=
                        listaConti.length
                    ) {
                        return false;
                    }


                    var contoScelto =
                        listaConti[
                            indiceConto
                        ];


                    var nome =
                        String(
                            campoNome.text || ""
                        )
                        .trim();


                    if (!nome) {
                        avviso(
                            "Dato mancante",
                            "Inserisci il nome del Salvadanaio."
                        );

                        return false;
                    }


                    var importoIniziale =
                        parseImporto(
                            campoImportoIniziale.text
                        );


                    if (
                        importoIniziale === null ||
                        importoIniziale < 0
                    ) {
                        avviso(
                            "Importo non valido",
                            "L'Importo Iniziale deve essere maggiore o uguale a zero."
                        );
                        return false;
                    }


                    importoIniziale =
                        arrotonda2(
                            importoIniziale
                        );


                    var valoreRegola =
                        0;


                    var entrataRiferimento =
                        null;


                    if (
                        richiedeRegola
                    ) {

                        valoreRegola =
                            parseImporto(
                                campoValoreRegola.text
                            );


                        if (
                            valoreRegola === null ||
                            valoreRegola <= 0
                        ) {
                            avviso(
                                "Valore non valido",
                                modalita == "Percentuale"
                                    ? "Inserisci una percentuale maggiore di zero."
                                    : "Inserisci un importo maggiore di zero."
                            );

                            return false;
                        }

                        if (
                            modalita == "Percentuale" &&
                            valoreRegola > 100
                        ) {
                            avviso(
                                "Percentuale non valida",
                                "La percentuale deve essere compresa tra 0 e 100."
                            );

                            return false;
                        }


                        valoreRegola =
                            arrotonda2(
                                valoreRegola
                            );


                        if (
                            riferimentiEntrate.length == 0
                        ) {
                            avviso(
                                "Entrata di Riferimento",
                                "Non esistono Entrate Fisse disponibili."
                            );

                            return false;
                        }


                        var indiceEntrata =
                            sceltaEntrata.selected;


                        if (
                            indiceEntrata < 0 ||
                            indiceEntrata >=
                            riferimentiEntrate.length
                        ) {
                            return false;
                        }


                        entrataRiferimento =
                            riferimentiEntrate[
                                indiceEntrata
                            ];
                    }


                    var nuovoSalvadanaio =
                        libSalvadanaio.create({

                            "Nome Salvadanaio":
                                nome,

                            "Importo Iniziale":
                                importoIniziale,

                            "Modalità":
                                modalita,

                            "Valore Regola":
                                valoreRegola,

                            "Attivo":
                                true

                        });


                    if (!nuovoSalvadanaio) {
                        return false;
                    }


                    nuovoSalvadanaio.link(
                        "Conto",
                        contoScelto
                    );

                    if (
                        entrataRiferimento
                    ) {
                        nuovoSalvadanaio.link(
                            "Entrata di Riferimento",
                            entrataRiferimento
                        );
                    }


                    if (
                        typeof ricalcolaSalvadanai !=
                        "function"
                    ) {
                        avviso(
                            "Motore non disponibile",
                            "ricalcolaSalvadanai() non è disponibile."
                        );

                        return false;
                    }


                    var risultato =
                        ricalcolaSalvadanai();


                    if (
                        risultato !== true
                    ) {
                        avviso(
                            "Errore",
                            "Ricalcolo Salvadanaio non completato."
                        );

                        return false;
                    }


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
    }


    // ========================================================
    // 5. API PUBBLICA
    // ========================================================

    return {

        versione:
            "0.12-D",

        apriNuovoSalvadanaio:
            function(contexto) {

                try {

                    configura(
                        contexto
                    );

                    return apriNuovoSalvadanaioInterno();

                } catch (
                    errore
                ) {

                    if (
                        contexto &&
                        typeof contexto.avviso ==
                        "function"
                    ) {
                        contexto.avviso(
                            "Nuovo Salvadanaio",
                            String(
                                errore
                            )
                        );

                    } else {
                        dialog()
                            .title(
                                "Nuovo Salvadanaio"
                            )
                            .text(
                                String(
                                    errore
                                )
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