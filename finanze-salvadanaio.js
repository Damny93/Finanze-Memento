// ============================================================
// FINANZE
// MODULO SALVADANAIO
// FILE ESTERNO
// VERSIONE 0.13-D
// ============================================================
//
// BASE:
// v0.13-C VALIDATA
//
// MODIFICA ATOMICA v0.13-D:
// modifica regola Salvadanaio:
// - Modalità: Fisso / Importo / Percentuale / Manuale
// - Fisso e Manuale: Valore Regola = 0 e nessuna Entrata di Riferimento
// - Importo: Valore Regola > 0 e Entrata di Riferimento obbligatoria
// - Percentuale: Valore Regola > 0 e <= 100, Entrata di Riferimento obbligatoria
// - ricalcolo immediato del motore dopo il salvataggio
//
// Nessuna modifica grafica strutturale in questa versione.
// Nessuna transazione bancaria viene creata.
//
// FUNZIONI PUBBLICHE:
// FinanzeSalvadanaio.apriNuovoSalvadanaio(contexto)
// FinanzeSalvadanaio.apriGestisciSalvadanaio(contexto)
//
// DIPENDENZE:
// - finanze-core.js
// - finanze-motore.js
// ============================================================

var FinanzeSalvadanaio = (function() {

    var libEntrateFisse = null;
    var libSalvadanaio = null;
    var libMovimentiSalvadanaio = null;

    var contiAttivi = null;
    var avviso = null;

    var arrotonda2 = null;
    var numero = null;
    var parseImporto = null;
    var formattaEuro = null;
    var relazioni = null;
    var etichettaConto = null;

    var TESTO = "#222222";
    var SECONDARIO = "#777777";
    var BLU = "#3F51B5";
    var VERDE = "#2E7D32";
    var GRIGIO = "#757575";


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
        libMovimentiSalvadanaio =
            ctx.libMovimentiSalvadanaio;

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

        numero =
            FinanzeCore.numero;

        parseImporto =
            FinanzeCore.parseImporto;

        formattaEuro =
            FinanzeCore.formattaEuro;

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
    // 5. GESTISCI SALVADANAIO - SELETTORE
    // ========================================================

    function apriGestisciSalvadanaioInterno() {

        if (
            !libSalvadanaio ||
            !libMovimentiSalvadanaio
        ) {
            avviso(
                "Gestisci Salvadanaio",
                "Le librerie Salvadanaio o Movimenti Salvadanaio non sono accessibili."
            );

            return true;
        }

        if (
            typeof ricalcolaSalvadanai !=
            "function"
        ) {
            avviso(
                "Motore non disponibile",
                "ricalcolaSalvadanai() non è disponibile."
            );

            return true;
        }


        ricalcolaSalvadanai();


        var tutti =
            libSalvadanaio.entries();

        var elenco =
            [];


        var opzioni =
            [];


        for (
            var i = 0;
            i < tutti.length;
            i++
        ) {

            var salvadanaio =
                tutti[i];


            if (
                !salvadanaio ||
                salvadanaio.deleted
            ) {
                continue;
            }


            elenco.push(
                salvadanaio
            );


            var nome =
                String(
                    salvadanaio.field(
                        "Nome Salvadanaio"
                    ) || "Salvadanaio"
                );


            var contoTesto =
                "";

            var relConto =
                relazioni(
                    salvadanaio.field(
                        "Conto"
                    )
                );


            if (
                relConto.length > 0
            ) {
                contoTesto =
                    " · " +
                    etichettaConto(
                        relConto[0]
                    );
            }


            var attivoVoce =
                salvadanaio.field(
                    "Attivo"
                ) === true;


            opzioni.push(
                nome +
                contoTesto +
                " · " +
                (
                    attivoVoce
                        ? "ATTIVO"
                        : "INATTIVO"
                ) +
                " · " +
                formattaEuro(
                    numero(
                        salvadanaio.field(
                            "Importo Effettivo"
                        )
                    )
                )
            );
        }


        if (
            elenco.length == 0
        ) {
            avviso(
                "Gestisci Salvadanaio",
                "Non ci sono Salvadanaio disponibili."
            );

            return true;
        }


        var scelta =
            ui()
            .choiceBox(
                0,
                opzioni
            );


        dialog()
            .title(
                "⚙ Gestisci Salvadanaio"
            )
            .view(
                ui()
                .layout([

                    testo(
                        "SELEZIONA SALVADANAIO",
                        10,
                        BLU,
                        "bold"
                    ),

                    scelta
                ])
                .width_match_parent()
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


                    apriRiepilogoSalvadanaio(
                        elenco[
                            indice
                        ]
                    );


                    return true;
                }
            )
            .neutralButton(
                "CAMBIA STATO",
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


                    apriCambioStatoSalvadanaio(
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
    // 6. GESTISCI SALVADANAIO - CAMBIO STATO
    // ========================================================

    function apriCambioStatoSalvadanaio(
        salvadanaio
    ) {

        if (
            !salvadanaio ||
            salvadanaio.deleted
        ) {
            avviso(
                "Gestisci Salvadanaio",
                "Il Salvadanaio selezionato non è più disponibile."
            );

            return;
        }


        var nome =
            String(
                salvadanaio.field(
                    "Nome Salvadanaio"
                ) || "Salvadanaio"
            );


        var attivo =
            salvadanaio.field(
                "Attivo"
            ) === true;

        var nuovoStato =
            !attivo;


        var effettivo =
            arrotonda2(
                numero(
                    salvadanaio.field(
                        "Importo Effettivo"
                    )
                )
            );


        var messaggio =
            attivo
                ? (
                    nome +
                    "\n\n" +
                    "Importo Effettivo: " +
                    formattaEuro(
                        effettivo
                    ) +
                    "\n\n" +
                    "Disattivandolo, la sua riserva non verrà più sottratta dal Saldo Disponibile e non saranno consentiti nuovi Anticipi o Rimborsi.\n\n" +
                    "Storico e valori del Salvadanaio restano conservati."
                )
                : (
                    nome +
                    "\n\n" +
                    "Importo Effettivo: " +
                    formattaEuro(
                        effettivo
                    ) +
                    "\n\n" +
                    "Riattivandolo, la sua riserva tornerà a essere considerata nel Saldo Disponibile."
                );


        dialog()
            .title(
                attivo
                    ? "Disattiva Salvadanaio"
                    : "Attiva Salvadanaio"
            )
            .text(
                messaggio
            )
            .positiveButton(
                attivo
                    ? "DISATTIVA"
                    : "ATTIVA",
                function() {

                    if (
                        !salvadanaio ||
                        salvadanaio.deleted
                    ) {
                        return false;
                    }


                    salvadanaio.set(
                        "Attivo",
                        nuovoStato
                    );


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

                    avviso(
                        nuovoStato
                            ? "Salvadanaio attivato"
                            : "Salvadanaio disattivato",
                        nome
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
    }

    // ========================================================
    // 7. GESTISCI SALVADANAIO - RIEPILOGO
    // ========================================================

    function apriRiepilogoSalvadanaio(
        salvadanaio
    ) {

        if (
            !salvadanaio ||
            salvadanaio.deleted
        ) {
            avviso(
                "Gestisci Salvadanaio",
                "Il Salvadanaio selezionato non è più disponibile."
            );

            return;
        }

        if (
            typeof ricalcolaSalvadanai !=
            "function"
        ) {
            avviso(
                "Motore non disponibile",
                "ricalcolaSalvadanai() non è disponibile."
            );

            return;
        }


        ricalcolaSalvadanai();


        var nome =
            String(
                salvadanaio.field(
                    "Nome Salvadanaio"
                ) || "Salvadanaio"
            );


        var modalita =
            String(
                salvadanaio.field(
                    "Modalità"
                ) || ""
            );


        var attivo =
            salvadanaio.field(
                "Attivo"
            ) === true;


        var importoSalvadanaio =
            arrotonda2(
                numero(
                    salvadanaio.field(
                        "Importo Salvadanaio"
                    )
                )
            );


        var anticipato =
            arrotonda2(
                numero(
                    salvadanaio.field(
                        "Anticipato"
                    )
                )
            );


        var effettivo =
            arrotonda2(
                numero(
                    salvadanaio.field(
                        "Importo Effettivo"
                    )
                )
            );


        var contoTesto =
            "Conto non definito";


        var relConto =
            relazioni(
                salvadanaio.field(
                    "Conto"
                )
            );


        if (
            relConto.length > 0
        ) {
            contoTesto =
                etichettaConto(
                    relConto[0]
                );
        }


        var btnModificaRegola =
            ui()
            .button(
                "✎ MODIFICA REGOLA"
            );


        btnModificaRegola.action(
            function() {

                apriModificaRegola(
                    salvadanaio
                );

                return true;
            }
        );


        var vista =
            ui()
            .layout([

                testo(
                    nome,
                    17,
                    TESTO,
                    "bold"
                ),

                testo(
                    contoTesto,
                    10,
                    SECONDARIO
                ),
                modalita
                    ? testo(
                        "Modalità · " +
                        modalita,
                        10,
                        SECONDARIO
                    )
                    : spazio(1),

                testo(
                    attivo
                        ? "● ATTIVO"
                        : "● INATTIVO",
                    10,
                    attivo
                        ? VERDE
                        : GRIGIO,
                    "bold"
                ),

                spazio(8),

                testo(
                    "ACCANTONATO",
                    10,
                    BLU,
                    "bold"
                ),

                testo(
                    formattaEuro(
                        importoSalvadanaio
                    ),
                    16,
                    TESTO,
                    "bold"
                ),

                spazio(6),

                testo(
                    "ANTICIPATO",
                    10,
                    BLU,
                    "bold"
                ),

                testo(
                    formattaEuro(
                        anticipato
                    ),
                    16,
                    TESTO,
                    "bold"
                ),

                spazio(6),

                testo(
                    "EFFETTIVO",
                    10,
                    BLU,
                    "bold"
                ),

                testo(
                    formattaEuro(
                        effettivo
                    ),
                    18,
                    TESTO,
                    "bold"
                ),

                spazio(9),

                btnModificaRegola

            ])
            .width_match_parent();


        dialog()
            .title(
                "Gestisci Salvadanaio"
            )
            .view(vista)
            .positiveButton(
                "ANTICIPA",
                function() {

                    apriMovimentoManuale(
                        salvadanaio,
                        "Anticipo"
                    );

                    return true;
                }
            )
            .neutralButton(
                "RIMBORSA",
                function() {

                    apriMovimentoManuale(
                        salvadanaio,
                        "Rimborso"
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
    }


    // ========================================================
    // 8. MODIFICA REGOLA
    // ========================================================

    function apriModificaRegola(
        salvadanaio
    ) {

        if (
            !salvadanaio ||
            salvadanaio.deleted
        ) {
            avviso(
                "Modifica Regola",
                "Il Salvadanaio selezionato non è più disponibile."
            );

            return;
        }


        var opzioniModalita =
            [
                "Fisso",
                "Importo",
                "Percentuale",
                "Manuale"
            ];


        var modalitaCorrente =
            String(
                salvadanaio.field(
                    "Modalità"
                ) || "Fisso"
            );


        var indiceCorrente =
            0;


        for (
            var i = 0;
            i < opzioniModalita.length;
            i++
        ) {
            if (
                opzioniModalita[i] ==
                modalitaCorrente
            ) {
                indiceCorrente = i;
                break;
            }
        }


        var sceltaModalita =
            ui()
            .choiceBox(
                indiceCorrente,
                opzioniModalita
            );


        var valoreCorrente =
            arrotonda2(
                numero(
                    salvadanaio.field(
                        "Valore Regola"
                    )
                )
            );


        var riferimentoCorrente =
            "Nessuno";


        var relRiferimento =
            relazioni(
                salvadanaio.field(
                    "Entrata di Riferimento"
                )
            );


        if (
            relRiferimento.length > 0
        ) {
            riferimentoCorrente =
                String(
                    relRiferimento[0].field(
                        "Entrata"
                    ) || "Entrata"
                );
        }


        var vista =
            ui()
            .layout([

                testo(
                    "MODALITÀ ATTUALE",
                    10,
                    BLU,
                    "bold"
                ),
                testo(
                    modalitaCorrente,
                    14,
                    TESTO,
                    "bold"
                ),

                spazio(5),

                testo(
                    "Valore Regola · " +
                    (
                        modalitaCorrente == "Percentuale"
                            ? String(valoreCorrente) + " %"
                            : formattaEuro(valoreCorrente)
                    ),
                    10,
                    SECONDARIO
                ),

                testo(
                    "Entrata · " +
                    riferimentoCorrente,
                    10,
                    SECONDARIO
                ),

                spazio(9),

                testo(
                    "NUOVA MODALITÀ",
                    10,
                    BLU,
                    "bold"
                ),

                sceltaModalita

            ])
            .width_match_parent();

        dialog()
            .title(
                "✎ Modifica Regola"
            )
            .view(vista)
            .positiveButton(
                "CONTINUA",
                function() {

                    var indice =
                        sceltaModalita.selected;


                    if (
                        indice < 0 ||
                        indice >=
                        opzioniModalita.length
                    ) {
                        return false;
                    }

                    apriDatiModificaRegola(
                        salvadanaio,
                        opzioniModalita[
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
    }

    // ========================================================
    // 9. MODIFICA REGOLA - DATI / SALVATAGGIO
    // ========================================================

    function apriDatiModificaRegola(
        salvadanaio,
        nuovaModalita
    ) {

        if (
            !salvadanaio ||
            salvadanaio.deleted
        ) {
            avviso(
                "Modifica Regola",
                "Il Salvadanaio selezionato non è più disponibile."
            );

            return;
        }


        var richiedeRegola =
            (
                nuovaModalita == "Importo" ||
                nuovaModalita == "Percentuale"
            );


        if (
            !richiedeRegola
        ) {

            var testoConferma =
                nuovaModalita == "Fisso"
                    ? "La modalità Fisso non usa Valore Regola né Entrata di Riferimento."
                    : "La modalità Manuale non usa Valore Regola né Entrata di Riferimento.";


            dialog()
                .title(
                    "Regola · " +
                    nuovaModalita
                )
                .text(
                    testoConferma +
                    "\n\n" +
                    "Valore Regola verrà impostato a 0 e gli eventuali collegamenti a Entrata di Riferimento saranno rimossi."
                )
                .positiveButton(
                    "SALVA",
                    function() {

                        return salvaRegolaSalvadanaio(
                            salvadanaio,
                            nuovaModalita,
                            0,
                            null
                        );
                    }
                )
                .negativeButton(
                    "ANNULLA",
                    function() {
                        return true;
                    }
                )
                .show();


            return;
        }


        if (!libEntrateFisse) {
            avviso(
                "Entrata di Riferimento",
                "La libreria [■] Entrate Fisse non è accessibile."
            );

            return;
        }

        var tutteEntrate =
            libEntrateFisse.entries();


        var riferimentiEntrate =
            [];


        var opzioniEntrate =
            [];


        var riferimentoAttuale =
            relazioni(
                salvadanaio.field(
                    "Entrata di Riferimento"
                )
            );

        var idRiferimentoAttuale =
            riferimentoAttuale.length > 0
                ? String(
                    riferimentoAttuale[0].id || ""
                )
                : "";


        var indiceRiferimentoAttuale =
            0;


        for (
            var e = 0;
            e < tutteEntrate.length;
            e++
        ) {

            var entrata =
                tutteEntrate[e];

            if (
                !entrata ||
                entrata.deleted
            ) {
                continue;
            }


            if (
                String(
                    entrata.id || ""
                ) ==
                idRiferimentoAttuale
            ) {
                indiceRiferimentoAttuale =
                    riferimentiEntrate.length;
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


        if (
            riferimentiEntrate.length == 0
        ) {
            avviso(
                "Entrata di Riferimento",
                "Non esistono Entrate Fisse disponibili."
            );

            return;
        }


        var modalitaAttuale =
            String(
                salvadanaio.field(
                    "Modalità"
                ) || ""
            );


        var valoreAttuale =
            arrotonda2(
                numero(
                    salvadanaio.field(
                        "Valore Regola"
                    )
                )
            );


        var valorePredefinito =
            modalitaAttuale == nuovaModalita &&
            valoreAttuale > 0
                ? String(
                    valoreAttuale
                ).replace(
                    ".",
                    ","
                )
                : "";


        var campoValore =
            ui()
            .edit(
                valorePredefinito
            );


        var sceltaEntrata =
            ui()
            .choiceBox(
                indiceRiferimentoAttuale,
                opzioniEntrate
            );


        var vista =
            ui()
            .layout([

                testo(
                    "MODALITÀ",
                    10,
                    BLU,
                    "bold"
                ),
                testo(
                    nuovaModalita,
                    14,
                    TESTO,
                    "bold"
                ),

                spazio(8),

                testo(
                    nuovaModalita == "Percentuale"
                        ? "PERCENTUALE DA ACCANTONARE (%)"
                        : "IMPORTO DA ACCANTONARE (€)",
                    10,
                    BLU,
                    "bold"
                ),

                campoValore,

                spazio(7),

                testo(
                    "ENTRATA DI RIFERIMENTO",
                    10,
                    BLU,
                    "bold"
                ),

                sceltaEntrata

            ])
            .width_match_parent();


        dialog()
            .title(
                "Regola · " +
                nuovaModalita
            )
            .view(vista)
            .positiveButton(
                "SALVA",
                function() {

                    var valore =
                        parseImporto(
                            campoValore.text
                        );


                    if (
                        valore === null ||
                        valore <= 0
                    ) {
                        avviso(
                            "Valore non valido",
                            nuovaModalita == "Percentuale"
                                ? "Inserisci una percentuale maggiore di zero."
                                : "Inserisci un importo maggiore di zero."
                        );

                        return false;
                    }


                    if (
                        nuovaModalita == "Percentuale" &&
                        valore > 100
                    ) {
                        avviso(
                            "Percentuale non valida",
                            "La percentuale deve essere compresa tra 0 e 100."
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


                    return salvaRegolaSalvadanaio(
                        salvadanaio,
                        nuovaModalita,
                        arrotonda2(
                            valore
                        ),
                        riferimentiEntrate[
                            indiceEntrata
                        ]
                    );
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
    // 10. SALVA REGOLA
    // ========================================================

    function salvaRegolaSalvadanaio(
        salvadanaio,
        modalita,
        valoreRegola,
        entrataRiferimento
    ) {

        if (
            !salvadanaio ||
            salvadanaio.deleted
        ) {
            return false;
        }


        var collegamentiAttuali =
            relazioni(
                salvadanaio.field(
                    "Entrata di Riferimento"
                )
            );


        for (
            var i =
                collegamentiAttuali.length - 1;
            i >= 0;
            i--
        ) {
            salvadanaio.unlink(
                "Entrata di Riferimento",
                collegamentiAttuali[i]
            );
        }


        salvadanaio.set(
            "Modalità",
            modalita
        );


        salvadanaio.set(
            "Valore Regola",
            valoreRegola
        );


        if (
            entrataRiferimento
        ) {
            salvadanaio.link(
                "Entrata di Riferimento",
                entrataRiferimento
            );
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


        avviso(
            "Regola aggiornata",
            modalita == "Percentuale"
                ? (
                    "Modalità: " +
                    modalita +
                    "\nValore Regola: " +
                    String(valoreRegola).replace(".", ",") +
                    " %"
                )
                : (
                    modalita == "Importo"
                        ? (
                            "Modalità: " +
                            modalita +
                            "\nValore Regola: " +
                            formattaEuro(
                                valoreRegola
                            )
                        )
                        : (
                            "Modalità: " +
                            modalita +
                            "\nValore Regola: 0"
                        )
                )
        );


        return true;
    }


    // ========================================================
    // 11. ANTICIPO / RIMBORSO
    // ========================================================

    function apriMovimentoManuale(
        salvadanaio,
        tipo
    ) {

        if (
            !salvadanaio ||
            salvadanaio.deleted ||
            salvadanaio.field(
                "Attivo"
            ) !== true
        ) {
            avviso(
                "Salvadanaio inattivo",
                "Riattiva il Salvadanaio prima di registrare Anticipi o Rimborsi."
            );

            return;
        }


        if (
            typeof ricalcolaSalvadanai !=
            "function"
        ) {
            avviso(
                "Motore non disponibile",
                "ricalcolaSalvadanai() non è disponibile."
            );

            return;
        }


        ricalcolaSalvadanai();


        var nome =
            String(
                salvadanaio.field(
                    "Nome Salvadanaio"
                ) || "Salvadanaio"
            );

        var massimo =
            tipo == "Anticipo"
                ? numero(
                    salvadanaio.field(
                        "Importo Effettivo"
                    )
                )
                : numero(
                    salvadanaio.field(
                        "Anticipato"
                    )
                );


        massimo =
            Math.max(
                0,
                arrotonda2(
                    massimo
                )
            );


        if (
            massimo <= 0
        ) {
            avviso(
                tipo == "Anticipo"
                    ? "Nuovo anticipo"
                    : "Nuovo rimborso",
                tipo == "Anticipo"
                    ? "Non c'è Importo Effettivo disponibile da anticipare."
                    : "Non ci sono anticipi da rimborsare."
            );

            return;
        }


        var campoImporto =
            ui()
            .edit("");


        var campoNote =
            ui()
            .edit("");


        var vista =
            ui()
            .layout([

                testo(
                    nome,
                    15,
                    TESTO,
                    "bold"
                ),

                spazio(6),
                testo(
                    "IMPORTO MASSIMO",
                    10,
                    BLU,
                    "bold"
                ),

                testo(
                    formattaEuro(
                        massimo
                    ),
                    15,
                    TESTO,
                    "bold"
                ),

                spazio(7),

                testo(
                    "IMPORTO (€)",
                    10,
                    BLU,
                    "bold"
                ),

                campoImporto,

                spazio(7),

                testo(
                    "NOTE (FACOLTATIVE)",
                    10,
                    BLU,
                    "bold"
                ),

                campoNote

            ])
            .width_match_parent();

        dialog()
            .title(
                tipo == "Anticipo"
                    ? "Nuovo anticipo"
                    : "Nuovo rimborso"
            )
            .view(vista)
            .positiveButton(
                "REGISTRA",
                function() {

                    ricalcolaSalvadanai();


                    var massimoAggiornato =
                        tipo == "Anticipo"
                            ? numero(
                                salvadanaio.field(
                                    "Importo Effettivo"
                                )
                            )
                            : numero(
                                salvadanaio.field(
                                    "Anticipato"
                                )
                            );


                    massimoAggiornato =
                        Math.max(
                            0,
                            arrotonda2(
                                massimoAggiornato
                            )
                        );


                    var importo =
                        parseImporto(
                            campoImporto.text
                        );

                    if (
                        importo === null ||
                        importo <= 0
                    ) {
                        avviso(
                            "Importo non valido",
                            "Inserisci un importo numerico maggiore di zero."
                        );

                        return false;
                    }


                    importo =
                        arrotonda2(
                            importo
                        );


                    if (
                        importo >
                        massimoAggiornato
                    ) {
                        avviso(
                            "Importo troppo alto",
                            "Importo massimo: " +
                            formattaEuro(
                                massimoAggiornato
                            )
                        );

                        return false;
                    }


                    var note =
                        String(
                            campoNote.text || ""
                        )
                        .trim();

                    var nuovoMovimento =
                        libMovimentiSalvadanaio.create({

                            "Movimento":
                                tipo +
                                " - " +
                                nome,

                            "Data e Ora":
                                new Date()
                                    .getTime(),

                            "Importo":
                                importo,

                            "Tipo di Movimento":
                                tipo,

                            "Origine":
                                "Manuale",

                            "Note":
                                note

                        });


                    if (
                        !nuovoMovimento
                    ) {
                        return false;
                    }


                    nuovoMovimento.link(
                        "Salvadanaio",
                        salvadanaio
                    );


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


                    avviso(
                        tipo == "Anticipo"
                            ? "Anticipo registrato"
                            : "Rimborso registrato",
                        (
                            tipo == "Anticipo"
                                ? "Anticipo registrato: "
                                : "Rimborso registrato: "
                        ) +
                        formattaEuro(
                            importo
                        )
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
    }

    // ========================================================
    // 9. API PUBBLICA
    // ========================================================

    return {

        versione:
            "0.13-D",

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
            },

        apriGestisciSalvadanaio:
            function(contexto) {

                try {

                    configura(
                        contexto
                    );

                    return apriGestisciSalvadanaioInterno();

                } catch (
                    errore
                ) {

                    if (
                        contexto &&
                        typeof contexto.avviso ==
                        "function"
                    ) {
                        contexto.avviso(
                            "Gestisci Salvadanaio",
                            String(
                                errore
                            )
                        );

                    } else {
                        dialog()
                            .title(
                                "Gestisci Salvadanaio"
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