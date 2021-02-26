import { NumberSymbol } from "@angular/common";

export interface FullTextResult {
    case_id: string;
    content: string;
    slug: string;
    court: string;
    file_Number: string;
    date: string;
    created_date: string;
    updated_date: string;
    type: string;
    ecli: string;
    sentiment: number;
    // FullTextResult(id: string, slug: string, court: string, fileNumber: string, 
    //     date: string, created_date: string, update_date: string, type: string, ecli: string, content: string) {

    //     this.caseId = id;
    //     this.slug = slug;
    //     this.court = court;
    //     this.fileNumber = fileNumber;
    //     this.date = date;
    //     this.created_date = created_date;
    //     this.updated_date = update_date;
    //     this.type = type;
    //     this.ecli = ecli;
    //     this.content = content;}

}

export interface ParseResult {
    Subjekt: string[];
    AkkusativObjekt: string[];
    DativObjekt: string[];
    ROOT: string[];
    Rest: string[];
}

export interface QueryResult {
    case_id: string;
    fullSentence: string;
    slug: string;
    court_id: string;
    court_name: string;
    court_slug: string;
    court_city: string;
    court_state: string;
    court_jurisdiction: string;
    court_level_of_appeal: string;
    file_Number: string;
    date: string;
    created_date: string;
    updated_date: string;
    type: string;
    ecli: string;
    sentiment: number;
    sentence_sentiment: number;
    sentence_number: number;
    root: string[];
    akkusativobjekt: string[];
    dativobjekt: string[];
    rest: string[];
    subjekt: string[];
    geldbetrag: number[];
    fullCaseText: string;
}