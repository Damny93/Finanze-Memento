// ============================================================
// FINANZE
// MOTORE CENTRALE - RICALCOLO FINANZE
// VERSIONE: 0.8.2 PRO
// ============================================================
//
// LIBRERIA:
// [■] Transazioni
//
// TIPO:
// Condiviso
//
// FUNZIONE PUBBLICA:
// ricalcolaFinanze()
//
// BASE:
// 0.8.1 PRO - VERIFICATO
//
// NOVITÀ 0.8.3:
//
// - CENTRALIZZAZIONE SALDI PER CONTO.
//
// Ogni record di [■] Conti riceve:
//
//      Saldo Attuale
//      Saldo Disponibile
//
// Saldo Disponibile =
//
//      Saldo Attuale
//      - Salvadanaio già accantonato
//      - Spese Fisse residue del mese
//      - Accantonamenti ancora previsti
//
// - Funziona anche sui conti senza Check:
//      Saldo Iniziale + Transazioni.
//
// - Dashboard e widget possono leggere direttamente
//   i valori centralizzati senza ricalcolarli.
//
// LOGICA RICONCILIAZIONE:
//
// - Primo Check = baseline automatica.
// - Check successivi = VERIFICA ENTRATE.
// - Nessuna "Altra Spesa" viene creata finché
//   "Entrate Verificate" non è true.
// - Differenza positiva riapre il Check.
// - Quando un Check viene chiuso in OK, tutte le
//   transazioni dell'intervallo vengono collegate
//   a quel Check in modo idempotente.
//
// ============================================================


function versioneMotoreFinanze() {

    return "0.8.3 PRO";
}


function ricalcolaFinanze(
    libreriaSaldo,
    libreriaTransazioni,
    libreriaConti,
    libreriaDashboard,
    libreriaSpeseFisseDashboard,
    libreriaSalvadanaioDashboard
) {


    // ========================================================
    // 1. CONTROLLO LIBRERIE
    // ========================================================

    if (
        !libreriaSaldo ||
        !libreriaTransazioni ||
        !libreriaConti ||
        !libreriaDashboard ||
        !libreriaSpeseFisseDashboard ||
        !libreriaSalvadanaioDashboard
    ) {

        message(
            "ERRORE v0.8.2: una o più librerie FINANZE non sono accessibili."
        );

        return;
    }


    // ========================================================
    // 2. DATI GLOBALI
    // ========================================================

    var tuttiCheck =
        libreriaSaldo.entries();

    var tutteTransazioni =
        libreriaTransazioni.entries();

    var tuttiConti =
        libreriaConti.entries();

    var tutteSpeseFisse =
        libreriaSpeseFisseDashboard.entries();

    var tuttiSalvadanai =
        libreriaSalvadanaioDashboard.entries();


    // Le riconciliazioni create durante l'esecuzione
    // vengono aggiunte anche all'array locale.
    var riconciliazioniCreate =
        [];


    // ========================================================
    // 3. PERIODO CORRENTE
    // ========================================================

    var momentoAdessoMotore =
        moment();

    var inizioMeseMotore =
        moment(
            momentoAdessoMotore
        )
        .startOf(
            "month"
        );

    var fineMeseMotore =
        moment(
            momentoAdessoMotore
        )
        .endOf(
            "month"
        );


    // ========================================================
    // 4. FUNZIONI COMUNI
    // ========================================================

    function contieneConto(
        collegamenti,
        idConto
    ) {

        if (
            !collegamenti ||
            collegamenti.length == 0
        ) {

            return false;
        }


        for (
            var i = 0;
            i < collegamenti.length;
            i++
        ) {

            if (
                collegamenti[i] &&
                collegamenti[i].id ==
                idConto
            ) {

                return true;
            }
        }


        return false;
    }


    function tempoVoce(
        voce
    ) {

        var data =
            voce.field(
                "Data e Ora"
            );


        if (!data) {

            return 0;
        }


        return moment(
            data
        )
        .toDate()
        .getTime();
    }


    function ordinaCronologicamente(
        a,
        b
    ) {

        var tempoA =
            tempoVoce(a);

        var tempoB =
            tempoVoce(b);


        if (
            tempoA < tempoB
        ) {

            return -1;
        }


        if (
            tempoA > tempoB
        ) {

            return 1;
        }


        var idA =
            String(
                a.id || ""
            );

        var idB =
            String(
                b.id || ""
            );


        if (
            idA < idB
        ) {

            return -1;
        }


        if (
            idA > idB
        ) {

            return 1;
        }


        return 0;
    }


    function ordinaMovimentiCronologicamente(
        a,
        b
    ) {

        var tempoA =
            tempoVoce(a);

        var tempoB =
            tempoVoce(b);


        if (
            tempoA < tempoB
        ) {

            return -1;
        }


        if (
            tempoA > tempoB
        ) {

            return 1;
        }


        var aRettifica =
            a.field("Origine") ==
                "Calcolata" &&
            a.field("Categoria") ==
                "Altre Spese";

        var bRettifica =
            b.field("Origine") ==
                "Calcolata" &&
            b.field("Categoria") ==
                "Altre Spese";


        if (
            aRettifica &&
            !bRettifica
        ) {

            return 1;
        }


        if (
            !aRettifica &&
            bRettifica
        ) {

            return -1;
        }


        var idA =
            String(
                a.id || ""
            );

        var idB =
            String(
                b.id || ""
            );


        if (
            idA < idB
        ) {

            return -1;
        }


        if (
            idA > idB
        ) {

            return 1;
        }


        return 0;
    }


    function arrotonda2(
        valore
    ) {

        return Math.round(
            Number(valore) *
            100
        ) / 100;
    }


    function dataNelMeseCorrente(
        data
    ) {

        if (!data) {

            return false;
        }


        var momento =
            moment(
                data
            );


        return (
            !momento.isBefore(
                inizioMeseMotore
            ) &&
            !momento.isAfter(
                fineMeseMotore
            )
        );
    }


    function formattaSaldoProgressivo(
        valore
    ) {

        var numero =
            Number(
                valore
            );


        if (
            !isFinite(
                numero
            )
        ) {

            return "";
        }


        var parti =
            Math.abs(numero)
            .toFixed(2)
            .split(".");


        var intero =
            parti[0]
            .replace(
                /\B(?=(\d{3})+(?!\d))/g,
                "."
            );


        var testo =
            intero +
            "," +
            parti[1] +
            " €";


        if (
            numero < 0
        ) {

            return (
                "[ \u26C3 - " +
                testo +
                " ]"
            );
        }


        return (
            "[ \u26C3 " +
            testo +
            " ]"
        );
    }


    // ========================================================
    // 4A. SALVADANAIO DEL SINGOLO CONTO
    // ========================================================

    function calcolaSalvadanaioConto(
        conto
    ) {

        var totale =
            0;


        var idConto =
            conto.id;


        for (
            var i = 0;
            i < tuttiSalvadanai.length;
            i++
        ) {

            var salvadanaio =
                tuttiSalvadanai[i];


            if (
                !salvadanaio.field(
                    "Attivo"
                )
            ) {

                continue;
            }


            if (
                !contieneConto(
                    salvadanaio.field(
                        "Conto"
                    ),
                    idConto
                )
            ) {

                continue;
            }


            var valoreEffettivo =
                Number(
                    salvadanaio.field(
                        "Importo Effettivo"
                    )
                );


            if (
                !isFinite(
                    valoreEffettivo
                )
            ) {

                var nominale =
                    Number(
                        salvadanaio.field(
                            "Importo Salvadanaio"
                        )
                    );

                var anticipato =
                    Number(
                        salvadanaio.field(
                            "Anticipato"
                        )
                    );


                if (
                    !isFinite(
                        nominale
                    )
                ) {

                    nominale = 0;
                }


                if (
                    !isFinite(
                        anticipato
                    )
                ) {

                    anticipato = 0;
                }


                valoreEffettivo =
                    nominale -
                    anticipato;
            }


            if (
                valoreEffettivo < 0
            ) {

                valoreEffettivo = 0;
            }


            totale +=
                valoreEffettivo;
        }


        return arrotonda2(
            totale
        );
    }


    // ========================================================
    // 4B. SPESE FISSE RESIDUE DEL SINGOLO CONTO
    // ========================================================

    function calcolaSpeseResidueConto(
        conto
    ) {

        var totale =
            0;


        var idConto =
            conto.id;


        for (
            var i = 0;
            i < tutteSpeseFisse.length;
            i++
        ) {

            var spesa =
                tutteSpeseFisse[i];


            if (
                !contieneConto(
                    spesa.field(
                        "Conto"
                    ),
                    idConto
                )
            ) {

                continue;
            }


            var prossimaScadenza =
                spesa.field(
                    "Prossima Scadenza"
                ) ||
                spesa.field(
                    "Prima Scadenza"
                );


            if (
                !dataNelMeseCorrente(
                    prossimaScadenza
                )
            ) {

                continue;
            }


            var importoRata =
                Number(
                    spesa.field(
                        "Importo Rata"
                    )
                );


            if (
                !isFinite(
                    importoRata
                ) ||
                importoRata <= 0
            ) {

                continue;
            }


            totale +=
                importoRata;
        }


        return arrotonda2(
            totale
        );
    }


    // ========================================================
    // 4C. ACCANTONAMENTI ANCORA PREVISTI DEL CONTO
    // ========================================================

    function calcolaAccantonamentiPrevistiConto(
        conto
    ) {

        var totale =
            0;


        var idConto =
            conto.id;


        for (
            var i = 0;
            i < tuttiSalvadanai.length;
            i++
        ) {

            var salvadanaio =
                tuttiSalvadanai[i];


            if (
                !salvadanaio.field(
                    "Attivo"
                )
            ) {

                continue;
            }


            // Il salvadanaio deve appartenere
            // al conto in analisi.
            if (
                !contieneConto(
                    salvadanaio.field(
                        "Conto"
                    ),
                    idConto
                )
            ) {

                continue;
            }


            var modalita =
                salvadanaio.field(
                    "Modalità"
                );


            if (
                modalita !=
                    "Importo a paga" &&
                modalita !=
                    "Percentuale a paga"
            ) {

                continue;
            }


            var valoreRegola =
                Number(
                    salvadanaio.field(
                        "Valore Regola"
                    )
                );


            if (
                !isFinite(
                    valoreRegola
                ) ||
                valoreRegola <= 0
            ) {

                continue;
            }


            var entrateRiferimento =
                salvadanaio.field(
                    "Entrata di Riferimento"
                );


            if (
                !entrateRiferimento ||
                entrateRiferimento.length == 0
            ) {

                continue;
            }


            for (
                var er = 0;
                er < entrateRiferimento.length;
                er++
            ) {

                var entrata =
                    entrateRiferimento[er];


                if (!entrata) {

                    continue;
                }


                // Anche l'entrata di riferimento
                // deve appartenere allo stesso conto.
                if (
                    !contieneConto(
                        entrata.field(
                            "Conto"
                        ),
                        idConto
                    )
                ) {

                    continue;
                }


                var prossimaEntrata =
                    entrata.field(
                        "Prossima Entrata"
                    ) ||
                    entrata.field(
                        "Prima Entrata"
                    );


                if (
                    !dataNelMeseCorrente(
                        prossimaEntrata
                    )
                ) {

                    continue;
                }


                var quota =
                    0;


                if (
                    modalita ==
                    "Importo a paga"
                ) {

                    quota =
                        valoreRegola;

                } else {

                    var importoPrevisto =
                        Number(
                            entrata.field(
                                "Importo Previsto"
                            )
                        );


                    if (
                        !isFinite(
                            importoPrevisto
                        ) ||
                        importoPrevisto <= 0
                    ) {

                        continue;
                    }


                    quota =
                        importoPrevisto *
                        valoreRegola /
                        100;
                }


                if (
                    isFinite(
                        quota
                    ) &&
                    quota > 0
                ) {

                    totale +=
                        quota;
                }
            }
        }


        return arrotonda2(
            totale
        );
    }


    // ========================================================
    // 4D. SALDO DISPONIBILE CENTRALIZZATO
    // ========================================================

    function calcolaSaldoDisponibileConto(
        conto,
        saldoAttuale
    ) {

        if (
            !isFinite(
                saldoAttuale
            )
        ) {

            return null;
        }


        var salvadanaio =
            calcolaSalvadanaioConto(
                conto
            );


        var speseResidue =
            calcolaSpeseResidueConto(
                conto
            );


        var accantonamentiPrevisti =
            calcolaAccantonamentiPrevistiConto(
                conto
            );


        return arrotonda2(
            saldoAttuale -
            salvadanaio -
            speseResidue -
            accantonamentiPrevisti
        );
    }


    // ========================================================
    // 4E. NORMALIZZAZIONE CHECK RICONCILIAZIONE
    // ========================================================

    function normalizzaCheckRiconciliazione(
        movimento,
        checkCorretto
    ) {

        var collegamenti =
            movimento.field(
                "Check Riconciliazione"
            );


        if (
            collegamenti &&
            collegamenti.length == 1 &&
            collegamenti[0].id ==
                checkCorretto.id
        ) {

            return;
        }


        if (
            collegamenti &&
            collegamenti.length > 0
        ) {

            for (
                var rc =
                    collegamenti.length - 1;
                rc >= 0;
                rc--
            ) {

                movimento.unlink(
                    "Check Riconciliazione",
                    collegamenti[rc]
                );
            }
        }


        movimento.link(
            "Check Riconciliazione",
            checkCorretto
        );
    }


    function collegaMovimentiIntervallo(
        checkPrecedente,
        checkCorrente,
        idConto
    ) {

        var dataPrecedente =
            checkPrecedente.field(
                "Data e Ora"
            );

        var dataCorrente =
            checkCorrente.field(
                "Data e Ora"
            );


        if (
            !dataPrecedente ||
            !dataCorrente
        ) {

            return;
        }


        var momentoPrecedente =
            moment(
                dataPrecedente
            );

        var momentoCorrente =
            moment(
                dataCorrente
            );


        for (
            var cr = 0;
            cr < tutteTransazioni.length;
            cr++
        ) {

            var movimento =
                tutteTransazioni[cr];


            if (
                !contieneConto(
                    movimento.field(
                        "Conto"
                    ),
                    idConto
                )
            ) {

                continue;
            }


            var dataMovimento =
                movimento.field(
                    "Data e Ora"
                );


            if (!dataMovimento) {

                continue;
            }


            var momentoMovimento =
                moment(
                    dataMovimento
                );


            if (
                !momentoMovimento.isAfter(
                    momentoPrecedente
                ) ||
                momentoMovimento.isAfter(
                    momentoCorrente
                )
            ) {

                continue;
            }


            normalizzaCheckRiconciliazione(
                movimento,
                checkCorrente
            );
        }
    }


    // ========================================================
    // 5. CICLO DI RICOSTRUZIONE CONTI
    // ========================================================

    for (
        var indiceConto = 0;
        indiceConto < tuttiConti.length;
        indiceConto++
    ) {

        var conto =
            tuttiConti[
                indiceConto
            ];


        var idConto =
            conto.id;


        if (
            idConto == null
        ) {

            continue;
        }


        var collegamentoConto =
            conto;


        // ====================================================
        // 5A. CHECK DEL CONTO
        // ====================================================

        var checkContoOrdinati =
            [];


        for (
            var cc = 0;
            cc < tuttiCheck.length;
            cc++
        ) {

            var checkConto =
                tuttiCheck[cc];


            if (
                !contieneConto(
                    checkConto.field(
                        "Conto"
                    ),
                    idConto
                )
            ) {

                continue;
            }


            if (
                !checkConto.field(
                    "Data e Ora"
                )
            ) {

                continue;
            }


            checkContoOrdinati.push(
                checkConto
            );
        }


        checkContoOrdinati.sort(
            ordinaCronologicamente
        );


        // ====================================================
        // 5B. PRIMO CHECK
        // ====================================================

        if (
            checkContoOrdinati.length > 0
        ) {

            var primoCheck =
                checkContoOrdinati[0];


            primoCheck.set(
                "Entrate Verificate",
                true
            );


            primoCheck.set(
                "Differenza da giustificare",
                0
            );


            primoCheck.set(
                "Stato di Riconciliazione",
                "OK"
            );
        }


        // ====================================================
        // 5C. RICONCILIAZIONE DAL SECONDO CHECK
        // ====================================================

        for (
            var q = 1;
            q < checkContoOrdinati.length;
            q++
        ) {

            var checkPrecedente =
                checkContoOrdinati[
                    q - 1
                ];

            var checkCorrente =
                checkContoOrdinati[q];


            var dataPrecedente =
                checkPrecedente.field(
                    "Data e Ora"
                );

            var dataCorrente =
                checkCorrente.field(
                    "Data e Ora"
                );


            if (
                !dataPrecedente ||
                !dataCorrente
            ) {

                continue;
            }


            var momentoPrecedente =
                moment(
                    dataPrecedente
                );

            var momentoCorrente =
                moment(
                    dataCorrente
                );

            var timestampCorrente =
                momentoCorrente
                .toDate()
                .getTime();


            var saldoPrecedente =
                Number(
                    checkPrecedente.field(
                        "Disponibilità Netta"
                    )
                );

            var saldoCorrente =
                Number(
                    checkCorrente.field(
                        "Disponibilità Netta"
                    )
                );


            if (
                !isFinite(
                    saldoPrecedente
                ) ||
                !isFinite(
                    saldoCorrente
                )
            ) {

                continue;
            }


            // ================================================
            // 5D. CERCA RICONCILIAZIONE DEL CHECK
            // ================================================

            var riconciliazione =
                null;


            for (
                var r = 0;
                r < tutteTransazioni.length;
                r++
            ) {

                var transazioneR =
                    tutteTransazioni[r];


                if (
                    transazioneR.field(
                        "Origine"
                    ) != "Calcolata" ||
                    transazioneR.field(
                        "Categoria"
                    ) != "Altre Spese"
                ) {

                    continue;
                }


                if (
                    !contieneConto(
                        transazioneR.field(
                            "Conto"
                        ),
                        idConto
                    )
                ) {

                    continue;
                }


                var checkOrigineR =
                    transazioneR.field(
                        "Check Riconciliazione"
                    );


                var appartiene =
                    false;


                if (
                    checkOrigineR &&
                    checkOrigineR.length > 0
                ) {

                    for (
                        var ro = 0;
                        ro < checkOrigineR.length;
                        ro++
                    ) {

                        if (
                            checkOrigineR[ro].id ==
                            checkCorrente.id
                        ) {

                            appartiene =
                                true;

                            break;
                        }
                    }
                }


                // ============================================
                // RECUPERO LEGACY
                // ============================================

                if (
                    !appartiene &&
                    (
                        !checkOrigineR ||
                        checkOrigineR.length == 0
                    )
                ) {

                    var dataR =
                        transazioneR.field(
                            "Data e Ora"
                        );


                    if (dataR) {

                        var timestampR =
                            moment(
                                dataR
                            )
                            .toDate()
                            .getTime();


                        if (
                            timestampR ==
                            timestampCorrente
                        ) {

                            appartiene =
                                true;


                            transazioneR.link(
                                "Check Riconciliazione",
                                checkCorrente
                            );
                        }
                    }
                }


                if (
                    appartiene
                ) {

                    riconciliazione =
                        transazioneR;

                    break;
                }
            }


            // ================================================
            // 5E. MOVIMENTI REALI NELL'INTERVALLO
            // ================================================

            var entrateIntervallo =
                0;

            var usciteIntervallo =
                0;


            for (
                var m = 0;
                m < tutteTransazioni.length;
                m++
            ) {

                var movimento =
                    tutteTransazioni[m];


                var origineMovimento =
                    movimento.field(
                        "Origine"
                    );

                var categoriaMovimento =
                    movimento.field(
                        "Categoria"
                    );


                if (
                    origineMovimento ==
                        "Calcolata" &&
                    categoriaMovimento ==
                        "Altre Spese"
                ) {

                    continue;
                }


                if (
                    !contieneConto(
                        movimento.field(
                            "Conto"
                        ),
                        idConto
                    )
                ) {

                    continue;
                }


                var dataMovimento =
                    movimento.field(
                        "Data e Ora"
                    );


                if (!dataMovimento) {

                    continue;
                }


                var momentoMovimento =
                    moment(
                        dataMovimento
                    );


                if (
                    !momentoMovimento.isAfter(
                        momentoPrecedente
                    )
                ) {

                    continue;
                }


                if (
                    momentoMovimento.isAfter(
                        momentoCorrente
                    )
                ) {

                    continue;
                }


                var importoMovimento =
                    Number(
                        movimento.field(
                            "Importo"
                        )
                    );


                if (
                    !isFinite(
                        importoMovimento
                    )
                ) {

                    continue;
                }


                var tipoMovimento =
                    movimento.field(
                        "Tipo"
                    );


                if (
                    tipoMovimento ==
                    "Entrata"
                ) {

                    entrateIntervallo +=
                        importoMovimento;

                } else if (
                    tipoMovimento ==
                    "Uscita"
                ) {

                    usciteIntervallo +=
                        importoMovimento;
                }
            }


            entrateIntervallo =
                arrotonda2(
                    entrateIntervallo
                );

            usciteIntervallo =
                arrotonda2(
                    usciteIntervallo
                );


            // ================================================
            // 5F. DIFFERENZA
            // ================================================

            var saldoAtteso =
                arrotonda2(
                    saldoPrecedente +
                    entrateIntervallo -
                    usciteIntervallo
                );


            var differenza =
                arrotonda2(
                    saldoCorrente -
                    saldoAtteso
                );


            // ================================================
            // 5G. BLOCCO DI VERIFICA ENTRATE
            // ================================================

            var precedenteVerificato =
                checkPrecedente.field(
                    "Entrate Verificate"
                ) === true;

            var statoPrecedente =
                checkPrecedente.field(
                    "Stato di Riconciliazione"
                );


            if (
                !precedenteVerificato ||
                statoPrecedente != "OK"
            ) {

                if (
                    riconciliazione
                ) {

                    riconciliazione.set(
                        "Importo",
                        0
                    );
                }


                checkCorrente.set(
                    "Entrate Verificate",
                    false
                );

                checkCorrente.set(
                    "Differenza da giustificare",
                    differenza
                );

                checkCorrente.set(
                    "Stato di Riconciliazione",
                    "CHECK PRECEDENTE DA CHIUDERE"
                );

                continue;
            }


            var entrateVerificate =
                checkCorrente.field(
                    "Entrate Verificate"
                ) === true;


            if (
                !entrateVerificate
            ) {

                if (
                    riconciliazione
                ) {

                    riconciliazione.set(
                        "Importo",
                        0
                    );
                }


                checkCorrente.set(
                    "Differenza da giustificare",
                    differenza
                );


                var statoCorrente =
                    checkCorrente.field(
                        "Stato di Riconciliazione"
                    );


                if (
                    differenza > 0 &&
                    statoCorrente ==
                        "ENTRATE DA REGISTRARE"
                ) {

                    checkCorrente.set(
                        "Stato di Riconciliazione",
                        "ENTRATE DA REGISTRARE"
                    );

                } else {

                    checkCorrente.set(
                        "Stato di Riconciliazione",
                        "VERIFICA ENTRATE"
                    );
                }


                continue;
            }


            // ================================================
            // 5H. DIFFERENZA NEGATIVA
            // ================================================

            if (
                differenza < 0
            ) {

                var importoAltreSpese =
                    arrotonda2(
                        Math.abs(
                            differenza
                        )
                    );


                if (
                    riconciliazione
                ) {

                    riconciliazione.set(
                        "Transazione",
                        "Altre Spese"
                    );

                    riconciliazione.set(
                        "Descrizione",
                        "Altre Spese"
                    );

                    riconciliazione.set(
                        "Data e Ora",
                        timestampCorrente
                    );

                    riconciliazione.set(
                        "Importo",
                        importoAltreSpese
                    );

                    riconciliazione.set(
                        "Tipo",
                        "Uscita"
                    );

                    riconciliazione.set(
                        "Categoria",
                        "Altre Spese"
                    );

                    riconciliazione.set(
                        "Origine",
                        "Calcolata"
                    );


                    if (
                        !contieneConto(
                            riconciliazione.field(
                                "Conto"
                            ),
                            idConto
                        )
                    ) {

                        riconciliazione.link(
                            "Conto",
                            collegamentoConto
                        );
                    }


                    if (
                        !contieneConto(
                            riconciliazione.field(
                                "Check Riconciliazione"
                            ),
                            checkCorrente.id
                        )
                    ) {

                        riconciliazione.link(
                            "Check Riconciliazione",
                            checkCorrente
                        );
                    }

                } else {

                    var nuovaRiconciliazione =
                        libreriaTransazioni.create({

                            "Transazione":
                                "Altre Spese",

                            "Descrizione":
                                "Altre Spese",

                            "Data e Ora":
                                timestampCorrente,

                            "Importo":
                                importoAltreSpese,

                            "Tipo":
                                "Uscita",

                            "Categoria":
                                "Altre Spese",

                            "Origine":
                                "Calcolata"

                        });


                    if (
                        nuovaRiconciliazione
                    ) {

                        nuovaRiconciliazione.link(
                            "Conto",
                            collegamentoConto
                        );

                        nuovaRiconciliazione.link(
                            "Check Riconciliazione",
                            checkCorrente
                        );


                        riconciliazioniCreate.push(
                            nuovaRiconciliazione
                        );

                        tutteTransazioni.push(
                            nuovaRiconciliazione
                        );
                    }
                }


                checkCorrente.set(
                    "Entrate Verificate",
                    true
                );

                checkCorrente.set(
                    "Differenza da giustificare",
                    0
                );

                checkCorrente.set(
                    "Stato di Riconciliazione",
                    "OK"
                );
            }


            // ================================================
            // 5I. DIFFERENZA POSITIVA
            // ================================================

            else if (
                differenza > 0
            ) {

                if (
                    riconciliazione
                ) {

                    riconciliazione.set(
                        "Importo",
                        0
                    );


                    if (
                        !contieneConto(
                            riconciliazione.field(
                                "Check Riconciliazione"
                            ),
                            checkCorrente.id
                        )
                    ) {

                        riconciliazione.link(
                            "Check Riconciliazione",
                            checkCorrente
                        );
                    }
                }


                checkCorrente.set(
                    "Entrate Verificate",
                    false
                );

                checkCorrente.set(
                    "Differenza da giustificare",
                    differenza
                );

                checkCorrente.set(
                    "Stato di Riconciliazione",
                    "ENTRATE DA REGISTRARE"
                );
            }


            // ================================================
            // 5J. DIFFERENZA ZERO
            // ================================================

            else {

                if (
                    riconciliazione
                ) {

                    riconciliazione.set(
                        "Importo",
                        0
                    );


                    if (
                        !contieneConto(
                            riconciliazione.field(
                                "Check Riconciliazione"
                            ),
                            checkCorrente.id
                        )
                    ) {

                        riconciliazione.link(
                            "Check Riconciliazione",
                            checkCorrente
                        );
                    }
                }


                checkCorrente.set(
                    "Entrate Verificate",
                    true
                );

                checkCorrente.set(
                    "Differenza da giustificare",
                    0
                );

                checkCorrente.set(
                    "Stato di Riconciliazione",
                    "OK"
                );
            }


            // ================================================
            // 5K. COLLEGA MOVIMENTI AL CHECK CHIUSO
            // ================================================

            if (
                checkCorrente.field(
                    "Entrate Verificate"
                ) === true &&
                checkCorrente.field(
                    "Stato di Riconciliazione"
                ) == "OK"
            ) {

                collegaMovimentiIntervallo(
                    checkPrecedente,
                    checkCorrente,
                    idConto
                );
            }
        }


        // ====================================================
        // 6. SALDO PROGRESSIVO DEL CONTO
        // ====================================================

        var saldoIniziale =
            Number(
                conto.field(
                    "Saldo Iniziale"
                )
            );

        var dataSaldoIniziale =
            conto.field(
                "Data Saldo Iniziale"
            );


        var saldoContabileCorrenteConto =
            null;


        if (
            isFinite(
                saldoIniziale
            ) &&
            dataSaldoIniziale
        ) {

            var momentoSaldoIniziale =
                moment(
                    dataSaldoIniziale
                );


            var movimentiProgressivo =
                [];


            for (
                var fp = 0;
                fp < tutteTransazioni.length;
                fp++
            ) {

                var movimentoFiltro =
                    tutteTransazioni[fp];


                if (
                    !contieneConto(
                        movimentoFiltro.field(
                            "Conto"
                        ),
                        idConto
                    )
                ) {

                    continue;
                }


                var dataFiltro =
                    movimentoFiltro.field(
                        "Data e Ora"
                    );


                if (!dataFiltro) {

                    continue;
                }


                var momentoFiltro =
                    moment(
                        dataFiltro
                    );


                if (
                    momentoFiltro.isBefore(
                        momentoSaldoIniziale
                    )
                ) {

                    continue;
                }


                var tipoFiltro =
                    movimentoFiltro.field(
                        "Tipo"
                    );

                var categoriaFiltro =
                    movimentoFiltro.field(
                        "Categoria"
                    );


                if (
                    tipoFiltro ==
                        "Bilancio" &&
                    categoriaFiltro ==
                        "Bilancio Iniziale"
                ) {

                    continue;
                }


                movimentiProgressivo.push(
                    movimentoFiltro
                );
            }


            movimentiProgressivo.sort(
                ordinaMovimentiCronologicamente
            );


            var saldoProgressivo =
                arrotonda2(
                    saldoIniziale
                );


            for (
                var p = 0;
                p < movimentiProgressivo.length;
                p++
            ) {

                var movimentoProgressivo =
                    movimentiProgressivo[p];


                var tipoProgressivo =
                    movimentoProgressivo.field(
                        "Tipo"
                    );

                var importoProgressivo =
                    Number(
                        movimentoProgressivo.field(
                            "Importo"
                        )
                    );


                if (
                    !isFinite(
                        importoProgressivo
                    )
                ) {

                    continue;
                }


                if (
                    tipoProgressivo ==
                    "Entrata"
                ) {

                    saldoProgressivo +=
                        importoProgressivo;

                } else if (
                    tipoProgressivo ==
                    "Uscita"
                ) {

                    saldoProgressivo -=
                        importoProgressivo;

                } else {

                    continue;
                }


                saldoProgressivo =
                    arrotonda2(
                        saldoProgressivo
                    );


                movimentoProgressivo.set(
                    "Saldo Progressivo",
                    saldoProgressivo
                );


                movimentoProgressivo.set(
                    "Saldo Progressivo Visualizzato",
                    formattaSaldoProgressivo(
                        saldoProgressivo
                    )
                );
            }


            saldoContabileCorrenteConto =
                arrotonda2(
                    saldoProgressivo
                );
        }


        // ====================================================
        // 7. SALDO ATTUALE CENTRALIZZATO
        // ====================================================

        var saldoCorrenteConto =
            saldoContabileCorrenteConto;


        if (
            !isFinite(
                saldoCorrenteConto
            )
        ) {

            if (
                checkContoOrdinati.length > 0
            ) {

                var ultimoCheckConto =
                    checkContoOrdinati[
                        checkContoOrdinati.length - 1
                    ];


                var saldoUltimoCheck =
                    Number(
                        ultimoCheckConto.field(
                            "Disponibilità Netta"
                        )
                    );


                var dataUltimoCheck =
                    ultimoCheckConto.field(
                        "Data e Ora"
                    );


                if (
                    isFinite(
                        saldoUltimoCheck
                    ) &&
                    dataUltimoCheck
                ) {

                    saldoCorrenteConto =
                        arrotonda2(
                            saldoUltimoCheck
                        );


                    var momentoUltimoCheckConto =
                        moment(
                            dataUltimoCheck
                        );


                    for (
                        var sc = 0;
                        sc < tutteTransazioni.length;
                        sc++
                    ) {

                        var movimentoSuccessivo =
                            tutteTransazioni[sc];


                        if (
                            !contieneConto(
                                movimentoSuccessivo.field(
                                    "Conto"
                                ),
                                idConto
                            )
                        ) {

                            continue;
                        }


                        var dataSuccessiva =
                            movimentoSuccessivo.field(
                                "Data e Ora"
                            );


                        if (
                            !dataSuccessiva ||
                            !moment(
                                dataSuccessiva
                            ).isAfter(
                                momentoUltimoCheckConto
                            )
                        ) {

                            continue;
                        }


                        var tipoSuccessivo =
                            movimentoSuccessivo.field(
                                "Tipo"
                            );


                        var importoSuccessivo =
                            Number(
                                movimentoSuccessivo.field(
                                    "Importo"
                                )
                            );


                        if (
                            !isFinite(
                                importoSuccessivo
                            )
                        ) {

                            continue;
                        }


                        if (
                            tipoSuccessivo ==
                            "Entrata"
                        ) {

                            saldoCorrenteConto +=
                                importoSuccessivo;

                        } else if (
                            tipoSuccessivo ==
                            "Uscita"
                        ) {

                            saldoCorrenteConto -=
                                importoSuccessivo;
                        }


                        saldoCorrenteConto =
                            arrotonda2(
                                saldoCorrenteConto
                            );
                    }
                }
            }
        }


        // Fallback finale:
        // anche senza Data Saldo Iniziale e senza Check
        // mostriamo almeno il Saldo Iniziale.
        if (
            !isFinite(
                saldoCorrenteConto
            ) &&
            isFinite(
                saldoIniziale
            )
        ) {

            saldoCorrenteConto =
                arrotonda2(
                    saldoIniziale
                );
        }


        // ====================================================
        // 8. SCRITTURA SALDO ATTUALE
        // ====================================================

        if (
            isFinite(
                saldoCorrenteConto
            )
        ) {

            conto.set(
                "Saldo Attuale",
                saldoCorrenteConto
            );
        }


        // ====================================================
        // 9. SALDO DISPONIBILE CENTRALIZZATO
        // ====================================================
        //
        // Questa è la nuova fonte unica per Dashboard/Card.
        //
        // Saldo Disponibile =
        //
        // Saldo Attuale
        // - Salvadanaio già accantonato
        // - Spese ancora da sostenere questo mese
        // - Accantonamenti ancora previsti questo mese
        //
        // ====================================================

        var saldoDisponibileConto =
            calcolaSaldoDisponibileConto(
                conto,
                saldoCorrenteConto
            );


        if (
            saldoDisponibileConto !== null &&
            isFinite(
                saldoDisponibileConto
            )
        ) {

            conto.set(
                "Saldo Disponibile",
                saldoDisponibileConto
            );
        }
    }


    // ========================================================
    // 10. STATO CHECK PER DASHBOARD
    // ========================================================

    var momentoUltimoCheckDashboard =
        null;

    var statoCheckDashboard =
        "OK";

    var prioritaStatoDashboard =
        0;

    var numeroContiAttivi =
        0;

    var numeroContiConCheck =
        0;


    function impostaStatoDashboard(
        stato,
        priorita
    ) {

        if (
            priorita >
            prioritaStatoDashboard
        ) {

            statoCheckDashboard =
                stato;

            prioritaStatoDashboard =
                priorita;
        }
    }


    for (
        var dc = 0;
        dc < tuttiConti.length;
        dc++
    ) {

        var contoCheckDashboard =
            tuttiConti[dc];


        if (
            !contoCheckDashboard.field(
                "Attivo"
            )
        ) {

            continue;
        }


        numeroContiAttivi++;


        var idContoDashboard =
            contoCheckDashboard.id;


        var checkDashboardConto =
            [];


        for (
            var dck = 0;
            dck < tuttiCheck.length;
            dck++
        ) {

            if (
                contieneConto(
                    tuttiCheck[dck].field(
                        "Conto"
                    ),
                    idContoDashboard
                )
            ) {

                checkDashboardConto.push(
                    tuttiCheck[dck]
                );
            }
        }


        checkDashboardConto.sort(
            ordinaCronologicamente
        );


        if (
            checkDashboardConto.length == 0
        ) {

            impostaStatoDashboard(
                "CHECK MANCANTE",
                50
            );

            continue;
        }


        numeroContiConCheck++;


        var ultimoCheckDashboardConto =
            checkDashboardConto[
                checkDashboardConto.length - 1
            ];


        var dataUltimoCheckDashboardConto =
            ultimoCheckDashboardConto.field(
                "Data e Ora"
            );


        if (
            dataUltimoCheckDashboardConto
        ) {

            var momentoCheckConto =
                moment(
                    dataUltimoCheckDashboardConto
                );


            if (
                !momentoUltimoCheckDashboard ||
                momentoCheckConto.isBefore(
                    momentoUltimoCheckDashboard
                )
            ) {

                momentoUltimoCheckDashboard =
                    momentoCheckConto;
            }
        }


        var statoUltimoCheck =
            ultimoCheckDashboardConto.field(
                "Stato di Riconciliazione"
            );


        var entrateVerificateUltimoCheck =
            ultimoCheckDashboardConto.field(
                "Entrate Verificate"
            );


        if (
            statoUltimoCheck ==
            "CHECK PRECEDENTE DA CHIUDERE"
        ) {

            impostaStatoDashboard(
                "CHECK PRECEDENTE DA CHIUDERE",
                40
            );

        } else if (
            statoUltimoCheck ==
            "ENTRATE DA REGISTRARE"
        ) {

            impostaStatoDashboard(
                "ENTRATE DA REGISTRARE",
                30
            );

        } else if (
            statoUltimoCheck ==
                "VERIFICA ENTRATE" ||
            entrateVerificateUltimoCheck !==
                true
        ) {

            impostaStatoDashboard(
                "VERIFICA ENTRATE",
                20
            );

        } else if (
            statoUltimoCheck !=
            "OK"
        ) {

            impostaStatoDashboard(
                "ERRORE RICONCILIAZIONE",
                35
            );
        }
    }


    if (
        numeroContiAttivi == 0
    ) {

        statoCheckDashboard =
            "NESSUN CONTO ATTIVO";

        prioritaStatoDashboard =
            60;

    } else if (
        numeroContiConCheck == 0
    ) {

        statoCheckDashboard =
            "NESSUN CHECK";

        prioritaStatoDashboard =
            50;
    }


    // ========================================================
    // 11. DASHBOARD LEGACY
    // ========================================================

    if (
        libreriaDashboard
    ) {

        var cardsDashboard =
            libreriaDashboard.entries();


        var cardSaldoAttuale =
            null;

        var cardSaldoDisponibile =
            null;

        var cardSalvadanaio =
            null;

        var cardAltreSpeseMese =
            null;

        var cardSpeseFisseMese =
            null;

        var cardEntrateUsciteMese =
            null;


        for (
            var c = 0;
            c < cardsDashboard.length;
            c++
        ) {

            var card =
                cardsDashboard[c];


            var codiceKPI =
                card.field(
                    "Codice KPI"
                );


            if (
                codiceKPI ==
                "SALDO_ATTUALE"
            ) {

                cardSaldoAttuale =
                    card;

            } else if (
                codiceKPI ==
                "SALDO_DISPONIBILE"
            ) {

                cardSaldoDisponibile =
                    card;

            } else if (
                codiceKPI ==
                "SALVADANAIO"
            ) {

                cardSalvadanaio =
                    card;

            } else if (
                codiceKPI ==
                "ALTRE_SPESE_MESE"
            ) {

                cardAltreSpeseMese =
                    card;

            } else if (
                codiceKPI ==
                "SPESE_FISSE_MESE"
            ) {

                cardSpeseFisseMese =
                    card;

            } else if (
                codiceKPI ==
                "ENTRATE_USCITE_MESE"
            ) {

                cardEntrateUsciteMese =
                    card;
            }
        }


        // ====================================================
        // 11A. FORMATO
        // ====================================================

        function formattaEuroDashboard(
            valore
        ) {

            var numero =
                Number(
                    valore
                );


            if (
                !isFinite(
                    numero
                )
            ) {

                return "";
            }


            var parti =
                Math.abs(numero)
                .toFixed(2)
                .split(".");


            var intero =
                parti[0]
                .replace(
                    /\B(?=(\d{3})+(?!\d))/g,
                    "."
                );


            var risultato =
                intero +
                "," +
                parti[1] +
                " €";


            if (
                numero < 0
            ) {

                risultato =
                    "- " +
                    risultato;
            }


            return risultato;
        }


        function formattaSaldoDashboard(
            valore
        ) {

            return (
                "\u26C3 " +
                formattaEuroDashboard(
                    valore
                )
            );
        }


        function nomeMeseDashboard(
            numeroMese
        ) {

            var mesi = [
                "GENNAIO",
                "FEBBRAIO",
                "MARZO",
                "APRILE",
                "MAGGIO",
                "GIUGNO",
                "LUGLIO",
                "AGOSTO",
                "SETTEMBRE",
                "OTTOBRE",
                "NOVEMBRE",
                "DICEMBRE"
            ];


            return mesi[
                numeroMese
            ];
        }


        function dataNelMeseDashboard(
            data,
            inizio,
            fine
        ) {

            if (!data) {

                return false;
            }


            var momento =
                moment(
                    data
                );


            return (
                !momento.isBefore(
                    inizio
                ) &&
                !momento.isAfter(
                    fine
                )
            );
        }


        // ====================================================
        // 11B. PERIODO
        // ====================================================

        var momentoAdessoDashboard =
            moment();


        var inizioMese =
            moment(
                momentoAdessoDashboard
            )
            .startOf(
                "month"
            );


        var fineMese =
            moment(
                momentoAdessoDashboard
            )
            .endOf(
                "month"
            );


        var periodoDashboard =
            nomeMeseDashboard(
                momentoAdessoDashboard.month()
            ) +
            " " +
            momentoAdessoDashboard.year();


        // ====================================================
        // 11C. TOTALI CENTRALIZZATI DAI CONTI
        // ====================================================
        //
        // IMPORTANTE:
        //
        // Non ricalcoliamo il disponibile.
        //
        // Sommiamo semplicemente:
        //
        //      Conti.Saldo Attuale
        //      Conti.Saldo Disponibile
        //
        // Questo garantisce che:
        //
        // CARD CONTO
        // HEADER CONTI
        // DASHBOARD
        //
        // leggano gli stessi valori.
        // ====================================================

        var saldoAttualeDashboard =
            0;

        var saldoDisponibileDashboard =
            0;


        for (
            var cd = 0;
            cd < tuttiConti.length;
            cd++
        ) {

            var contoDashboard =
                tuttiConti[cd];


            if (
                !contoDashboard.field(
                    "Attivo"
                )
            ) {

                continue;
            }


            var saldoConto =
                Number(
                    contoDashboard.field(
                        "Saldo Attuale"
                    )
                );


            if (
                isFinite(
                    saldoConto
                )
            ) {

                saldoAttualeDashboard +=
                    saldoConto;
            }


            var disponibileConto =
                Number(
                    contoDashboard.field(
                        "Saldo Disponibile"
                    )
                );


            if (
                isFinite(
                    disponibileConto
                )
            ) {

                saldoDisponibileDashboard +=
                    disponibileConto;
            }
        }


        saldoAttualeDashboard =
            arrotonda2(
                saldoAttualeDashboard
            );


        saldoDisponibileDashboard =
            arrotonda2(
                saldoDisponibileDashboard
            );


        // ====================================================
        // 11D. SALDO ATTUALE
        // ====================================================

        if (
            cardSaldoAttuale
        ) {

            cardSaldoAttuale.set(
                "Saldo Attuale",
                saldoAttualeDashboard
            );


            cardSaldoAttuale.set(
                "Valore Saldo",
                formattaSaldoDashboard(
                    saldoAttualeDashboard
                )
            );


            cardSaldoAttuale.set(
                "Valore Secondario",
                ""
            );


            cardSaldoAttuale.set(
                "Stato Tecnico Check",
                statoCheckDashboard
            );


            if (
                momentoUltimoCheckDashboard
            ) {

                cardSaldoAttuale.set(
                    "Ultimo Check Saldo",
                    momentoUltimoCheckDashboard
                    .toDate()
                    .getTime()
                );
            }
        }


        // ====================================================
        // 11E. SALDO DISPONIBILE
        // ====================================================

        if (
            cardSaldoDisponibile
        ) {

            cardSaldoDisponibile.set(
                "Valore Saldo",
                formattaSaldoDashboard(
                    saldoDisponibileDashboard
                )
            );


            cardSaldoDisponibile.set(
                "Valore Secondario",
                ""
            );
        }


        // ====================================================
        // 11F. SPESE FISSE - REPORT MENSILE
        // ====================================================

        var speseFissePrevisteMese =
            0;


        for (
            var sf = 0;
            sf < tutteSpeseFisse.length;
            sf++
        ) {

            var spesaFissa =
                tutteSpeseFisse[sf];


            var importoMensile =
                Number(
                    spesaFissa.field(
                        "Importo Mese [1]"
                    )
                );


            if (
                isFinite(
                    importoMensile
                )
            ) {

                speseFissePrevisteMese +=
                    importoMensile;
            }
        }


        speseFissePrevisteMese =
            arrotonda2(
                speseFissePrevisteMese
            );


        // ====================================================
        // 11G. SALVADANAIO COMPLESSIVO
        // ====================================================

        var totaleSalvadanaio =
            0;


        for (
            var sv = 0;
            sv < tuttiSalvadanai.length;
            sv++
        ) {

            var salvadanaio =
                tuttiSalvadanai[sv];


            if (
                !salvadanaio.field(
                    "Attivo"
                )
            ) {

                continue;
            }


            var valoreEffettivo =
                Number(
                    salvadanaio.field(
                        "Importo Effettivo"
                    )
                );


            if (
                !isFinite(
                    valoreEffettivo
                )
            ) {

                var nominale =
                    Number(
                        salvadanaio.field(
                            "Importo Salvadanaio"
                        )
                    );

                var anticipato =
                    Number(
                        salvadanaio.field(
                            "Anticipato"
                        )
                    );


                if (
                    !isFinite(
                        nominale
                    )
                ) {

                    nominale = 0;
                }


                if (
                    !isFinite(
                        anticipato
                    )
                ) {

                    anticipato = 0;
                }


                valoreEffettivo =
                    nominale -
                    anticipato;
            }


            if (
                valoreEffettivo < 0
            ) {

                valoreEffettivo = 0;
            }


            totaleSalvadanaio +=
                valoreEffettivo;
        }


        totaleSalvadanaio =
            arrotonda2(
                totaleSalvadanaio
            );


        if (
            cardSalvadanaio
        ) {

            cardSalvadanaio.set(
                "Valore Saldo",
                formattaSaldoDashboard(
                    totaleSalvadanaio
                )
            );


            cardSalvadanaio.set(
                "Valore Secondario",
                ""
            );
        }


        // ====================================================
        // 11H. TRANSAZIONI DEL MESE
        // ====================================================

        var altreSpeseMese =
            0;

        var speseFisseMese =
            0;

        var entrateMese =
            0;

        var usciteMese =
            0;


        for (
            var x = 0;
            x < tutteTransazioni.length;
            x++
        ) {

            var movimentoKPI =
                tutteTransazioni[x];


            var categoriaKPI =
                movimentoKPI.field(
                    "Categoria"
                );


            var tipoKPI =
                movimentoKPI.field(
                    "Tipo"
                );


            var dataKPI =
                movimentoKPI.field(
                    "Data e Ora"
                );


            var importoKPI =
                Number(
                    movimentoKPI.field(
                        "Importo"
                    )
                );


            if (
                !dataKPI ||
                !isFinite(
                    importoKPI
                )
            ) {

                continue;
            }


            var momentoKPI =
                moment(
                    dataKPI
                );


            if (
                momentoKPI.isBefore(
                    inizioMese
                ) ||
                momentoKPI.isAfter(
                    fineMese
                )
            ) {

                continue;
            }


            if (
                tipoKPI ==
                    "Bilancio" &&
                categoriaKPI ==
                    "Bilancio Iniziale"
            ) {

                continue;
            }


            if (
                tipoKPI ==
                "Entrata"
            ) {

                entrateMese +=
                    importoKPI;

            } else if (
                tipoKPI ==
                "Uscita"
            ) {

                usciteMese +=
                    importoKPI;


                if (
                    categoriaKPI ==
                    "Altre Spese"
                ) {

                    altreSpeseMese +=
                        importoKPI;
                }


                if (
                    categoriaKPI ==
                    "Spesa Fissa"
                ) {

                    speseFisseMese +=
                        importoKPI;
                }
            }
        }


        altreSpeseMese =
            arrotonda2(
                altreSpeseMese
            );

        speseFisseMese =
            arrotonda2(
                speseFisseMese
            );

        entrateMese =
            arrotonda2(
                entrateMese
            );

        usciteMese =
            arrotonda2(
                usciteMese
            );


        // ====================================================
        // 11I. ALTRE SPESE
        // ====================================================

        if (
            cardAltreSpeseMese
        ) {

            cardAltreSpeseMese.set(
                "Altre Spese - Mese",
                altreSpeseMese
            );


            cardAltreSpeseMese.set(
                "Valore Uscita",
                formattaEuroDashboard(
                    altreSpeseMese
                )
            );


            cardAltreSpeseMese.set(
                "Periodo Dashboard",
                periodoDashboard
            );
        }


        // ====================================================
        // 11J. SPESE FISSE
        // ====================================================

        if (
            cardSpeseFisseMese
        ) {

            cardSpeseFisseMese.set(
                "Valore Uscita",
                formattaEuroDashboard(
                    speseFisseMese
                )
            );


            cardSpeseFisseMese.set(
                "Valore Secondario",
                "/ " +
                formattaEuroDashboard(
                    speseFissePrevisteMese
                )
            );


            cardSpeseFisseMese.set(
                "Periodo Dashboard",
                periodoDashboard
            );
        }


        // ====================================================
        // 11K. ENTRATE / USCITE
        // ====================================================

        if (
            cardEntrateUsciteMese
        ) {

            cardEntrateUsciteMese.set(
                "Valore Entrata",
                formattaEuroDashboard(
                    entrateMese
                )
            );


            cardEntrateUsciteMese.set(
                "Separatore",
                "/"
            );


            cardEntrateUsciteMese.set(
                "Valore Uscita",
                formattaEuroDashboard(
                    usciteMese
                )
            );


            cardEntrateUsciteMese.set(
                "Periodo Dashboard",
                periodoDashboard
            );


            cardEntrateUsciteMese.set(
                "Valore Secondario",
                ""
            );
        }


        // ====================================================
        // 11L. CONTROLLI DASHBOARD
        // ====================================================

        if (
            !cardSaldoAttuale
        ) {

            message(
                "ATTENZIONE: card SALDO_ATTUALE non trovata."
            );
        }


        if (
            !cardSaldoDisponibile
        ) {

            message(
                "ATTENZIONE: card SALDO_DISPONIBILE non trovata."
            );
        }


        if (
            !cardSalvadanaio
        ) {

            message(
                "ATTENZIONE: card SALVADANAIO non trovata."
            );
        }


        if (
            !cardAltreSpeseMese
        ) {

            message(
                "ATTENZIONE: card ALTRE_SPESE_MESE non trovata."
            );
        }


        if (
            !cardSpeseFisseMese
        ) {

            message(
                "ATTENZIONE: card SPESE_FISSE_MESE non trovata."
            );
        }


        if (
            !cardEntrateUsciteMese
        ) {

            message(
                "ATTENZIONE: card ENTRATE_USCITE_MESE non trovata."
            );
        }
    }


} // fine ricalcolaFinanze()
// ============================================================
// FINANZE
// MOTORE CENTRALE - SALVADANAI
// VERSIONE MOTORE: 0.8.3 PRO
// ============================================================
//
// FUNZIONE PUBBLICA:
// ricalcolaSalvadanai()
//
// SCOPO:
//
// Fonte unica di verità per il ricalcolo di:
//
// Importo Salvadanaio
// = Importo Iniziale + Accantonamenti
//
// Anticipato
// = Anticipi - Rimborsi
//
// Importo Effettivo
// = Importo Salvadanaio - Anticipato
//
// Al termine richiama automaticamente:
//
// ricalcolaFinanze()
//
// ============================================================


function ricalcolaSalvadanai() {


    // ========================================================
    // 1. FUNZIONI LOCALI
    // ========================================================

    function arrotonda2Salvadanaio(
        valore
    ) {

        return Math.round(
            Number(valore) * 100
        ) / 100;
    }


    function contieneRelazioneSalvadanaio(
        relazione,
        idCercato
    ) {

        if (
            !relazione ||
            !idCercato
        ) {

            return false;
        }


        // Protezione anche nel caso in cui Memento
        // restituisca una singola relazione.

        if (
            typeof relazione.length ==
            "undefined"
        ) {

            relazione =
                [relazione];
        }


        for (
            var i = 0;
            i < relazione.length;
            i++
        ) {

            if (
                relazione[i] &&
                relazione[i].id ==
                idCercato
            ) {

                return true;
            }
        }


        return false;
    }


    // ========================================================
    // 2. LIBRERIE
    // ========================================================

    var libreriaSalvadanaio =
        libByName(
            "[■] Salvadanaio"
        );


    var libreriaMovimentiSalvadanaio =
        libByName(
            "[■] Movimenti Salvadanaio"
        );


    var libreriaSaldo =
        libByName(
            "[■] Saldo"
        );


    var libreriaTransazioni =
        libByName(
            "[■] Transazioni"
        );


    var libreriaConti =
        libByName(
            "[■] Conti"
        );


    var libreriaDashboard =
        libByName(
            "[■] Dashboard Finanze"
        );


    var libreriaSpeseFisse =
        libByName(
            "[■] Spese Fisse"
        );


    // ========================================================
    // 3. CONTROLLO LIBRERIE
    // ========================================================

    if (
        !libreriaSalvadanaio ||
        !libreriaMovimentiSalvadanaio ||
        !libreriaSaldo ||
        !libreriaTransazioni ||
        !libreriaConti ||
        !libreriaDashboard ||
        !libreriaSpeseFisse
    ) {

        message(
            "ERRORE v0.8.3: una o più librerie FINANZE non sono accessibili."
        );


        return false;
    }


    // ========================================================
    // 4. DATI
    // ========================================================

    var salvadanai =
        libreriaSalvadanaio.entries();


    var movimenti =
        libreriaMovimentiSalvadanaio.entries();


    // ========================================================
    // 5. RICALCOLO DI OGNI SALVADANAIO
    // ========================================================

    for (
        var s = 0;
        s < salvadanai.length;
        s++
    ) {

        var salvadanaio =
            salvadanai[s];


        // ----------------------------------------------------
        // 5A. IMPORTO INIZIALE
        // ----------------------------------------------------

        var base =
            Number(
                salvadanaio.field(
                    "Importo Iniziale"
                )
            );


        if (
            !isFinite(base)
        ) {

            base = 0;
        }


        base =
            arrotonda2Salvadanaio(
                base
            );


        // ----------------------------------------------------
        // 5B. TOTALI MOVIMENTI
        // ----------------------------------------------------

        var totaleAccantonamenti =
            0;


        var totaleAnticipi =
            0;


        var totaleRimborsi =
            0;


        var ultimoIncremento =
            null;


        // ====================================================
        // 6. MOVIMENTI DEL SALVADANAIO
        // ====================================================

        for (
            var m = 0;
            m < movimenti.length;
            m++
        ) {

            var movimento =
                movimenti[m];


            if (
                !contieneRelazioneSalvadanaio(
                    movimento.field(
                        "Salvadanaio"
                    ),
                    salvadanaio.id
                )
            ) {

                continue;
            }


            var importo =
                Number(
                    movimento.field(
                        "Importo"
                    )
                );


            if (
                !isFinite(importo) ||
                importo <= 0
            ) {

                continue;
            }


            importo =
                arrotonda2Salvadanaio(
                    importo
                );


            var tipo =
                String(
                    movimento.field(
                        "Tipo di Movimento"
                    ) || ""
                );


            // ------------------------------------------------
            // ACCANTONAMENTO
            // ------------------------------------------------

            if (
                tipo ==
                "Accantonamento"
            ) {

                totaleAccantonamenti +=
                    importo;


                var dataMovimento =
                    movimento.field(
                        "Data e Ora"
                    );


                if (
                    dataMovimento
                ) {

                    var timestamp =
                        new Date(
                            dataMovimento
                        )
                        .getTime();


                    if (
                        !isNaN(timestamp) &&
                        (
                            ultimoIncremento === null ||
                            timestamp >
                            ultimoIncremento
                        )
                    ) {

                        ultimoIncremento =
                            timestamp;
                    }
                }
            }


            // ------------------------------------------------
            // ANTICIPO
            // ------------------------------------------------

            else if (
                tipo ==
                "Anticipo"
            ) {

                totaleAnticipi +=
                    importo;
            }


            // ------------------------------------------------
            // RIMBORSO
            // ------------------------------------------------

            else if (
                tipo ==
                "Rimborso"
            ) {

                totaleRimborsi +=
                    importo;
            }
        }


        // ====================================================
        // 7. IMPORTO NOMINALE
        // ====================================================

        var nominale =
            arrotonda2Salvadanaio(
                base +
                totaleAccantonamenti
            );


        // ====================================================
        // 8. ANTICIPATO
        // ====================================================

        var anticipato =
            arrotonda2Salvadanaio(
                totaleAnticipi -
                totaleRimborsi
            );


        if (
            anticipato < 0
        ) {

            anticipato = 0;
        }


        if (
            anticipato >
            nominale
        ) {

            anticipato =
                nominale;
        }


        // ====================================================
        // 9. IMPORTO EFFETTIVO
        // ====================================================

        var effettivo =
            arrotonda2Salvadanaio(
                nominale -
                anticipato
            );


        if (
            effettivo < 0
        ) {

            effettivo = 0;
        }


        // ====================================================
        // 10. SCRITTURA
        // ====================================================

        salvadanaio.set(
            "Importo Salvadanaio",
            nominale
        );


        salvadanaio.set(
            "Anticipato",
            anticipato
        );


        salvadanaio.set(
            "Importo Effettivo",
            effettivo
        );


        if (
            ultimoIncremento !== null
        ) {

            salvadanaio.set(
                "Ultimo Incremento",
                ultimoIncremento
            );
        }
    }


    // ========================================================
    // 11. RICALCOLO FINANZE
    // ========================================================
    //
    // Importo Effettivo è ora aggiornato.
    //
    // Possiamo quindi ricalcolare:
    //
    // - Saldo Disponibile dei Conti
    // - Dashboard
    // - tutti gli altri valori centralizzati.
    //
    // ========================================================

    ricalcolaFinanze(
        libreriaSaldo,
        libreriaTransazioni,
        libreriaConti,
        libreriaDashboard,
        libreriaSpeseFisse,
        libreriaSalvadanaio
    );


    return true;

} // fine ricalcolaSalvadanai()
