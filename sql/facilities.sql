WITH FacilitiesMeta AS (
    SELECT
        EPAFacilityID,
        FacilityName AS name,
        FacilityState AS state,
        FacilityCity AS city,
        MAX(SUBSTR(CompletionCheckDate, 1, 10)) AS ValidationDate,
        TRIM(
            COALESCE(FacilityStr1, '') || ' • ' || COALESCE(FacilityStr2, ''),
            ' •'
        ) AS address,
        FacilityZipCode AS zip,
        FacilityCountyFIPS AS county_fips,
        ParentCompanyName AS company_1,
        Company2Name AS company_2,
        OperatorName AS operator
    FROM
        tblS1Facilities 
    GROUP BY
        EPAFacilityID
    ORDER BY
        state,
        county_fips,
        LOWER(city),
        LOWER(name)
),

SubmissionsSorted AS (
    SELECT *
    FROM tblS1Facilities
    ORDER BY
        EPAFacilityID,
        CompletionCheckDate DESC
),
    
AccidentChemicalsByAccident AS (
    SELECT
        a.FacilityID AS SubmissionID,
        a.AccidentHistoryID,
        GROUP_CONCAT(ChemicalName, ' • ') AS AccidentChemicals
    FROM
        tblS6AccidentHistory a
    LEFT JOIN tblS6AccidentChemicals ac
        ON a.AccidentHistoryID = ac.AccidentHistoryID
    LEFT JOIN tlkpChemicals lk
        ON ac.ChemicalID = lk.ChemicalID
    GROUP BY
        SubmissionID,
        a.AccidentHistoryID
),

AccidentEntries AS (
    SELECT
        EPAFacilityID,
        a.AccidentHistoryID,
        a.FacilityID AS SubmissionID,
        SUBSTR(AccidentDate, 1, 10) AS AccidentDate,
        AccidentTime,
        ac.AccidentChemicals,
        (DeathsWorkers + DeathsPublicResponders + DeathsPublic + OffsiteDeaths) AS deaths,
        (InjuriesWorkers + InjuriesPublicResponders + InjuriesPublic + Hospitalization) AS inj,
        (Evacuated + ShelteredInPlace) AS ev_shlt,
        (OnsitePropertyDamage + OffsitePropertyDamage) AS damg
    FROM
        tblS6AccidentHistory a
        LEFT JOIN AccidentChemicalsByAccident ac
            ON a.AccidentHistoryID = ac.AccidentHistoryID
        LEFT JOIN tblS1Facilities s
            ON s.FacilityID = a.FacilityID
    ORDER BY
        SubmissionID DESC,
        AccidentDate DESC,
        AccidentTime DESC,
        a.AccidentHistoryID DESC
),


AccidentDateLatestSubmissions AS (
    SELECT
        a.EPAFacilityID,
        AccidentDate,
        MAX(SUBSTR(CompletionCheckDate, 1, 10)) AS ValidationDate,
        a.SubmissionID AS SubmissionIDLatest
    FROM
        AccidentEntries a
        LEFT JOIN tblS1Facilities s
            ON a.SubmissionID = s.FacilityID
    GROUP BY
        a.EPAFacilityID,
        AccidentDate
),

Accidents AS (
    SELECT
        a.*
    FROM
        AccidentEntries a
        LEFT JOIN AccidentDateLatestSubmissions latest
            ON a.EPAFacilityID = latest.EPAFacilityID
            AND a.AccidentDate = latest.AccidentDate
    WHERE
        a.SubmissionID = latest.SubmissionIDLatest
    ORDER BY
        a.SubmissionID DESC,
        a.AccidentDate DESC,
        a.AccidentTime DESC,
        a.AccidentHistoryID DESC
),

LatestAccidentCount AS (
    SELECT
        FacilityID AS SubmissionID,
        COUNT(*) AS num_accidents,
        MAX(AccidentDate) AS latest_accident
    FROM
        tblS6AccidentHistory
    GROUP BY
        FacilityID
),

FacilitySubmissions AS (
    SELECT
        EPAFacilityID,
        MAX(SUBSTR(CompletionCheckDate, 1, 10)) AS ValidationDate,
        JSON_GROUP_ARRAY(
            DISTINCT(FacilityName)
        ) AS names_all,
        JSON_GROUP_ARRAY(
            JSON_OBJECT(
                'id', sub.FacilityID,
                'date_rec', SUBSTR(ReceiptDate, 1, 10),
                'date_val', SUBSTR(CompletionCheckDate, 1, 10),
                'date_dereg', SUBSTR(DeRegistrationDate, 1, 10),
                'lat_sub', FacilityLatDecDegs,
                'lon_sub', FacilityLongDecDegs,
                'num_accidents', num_accidents,
                'latest_accident', SUBSTR(latest_accident, 1, 10),
                'name', FacilityName,
                'company_1', ParentCompanyName,
                'company_2', Company2Name,
                'operator', OperatorName
            )
        ) AS submissions,
        num_accidents
    FROM SubmissionsSorted sub
    LEFT JOIN
        LatestAccidentCount ac
        ON sub.FacilityID = ac.SubmissionID
    GROUP BY
        EPAFacilityID
),

FacilityAccidents AS (
    SELECT
        EPAFacilityID,
        JSON_GROUP_ARRAY(
            JSON_OBJECT(
                'id', AccidentHistoryID,
                'sub_id', SubmissionID,
                'date', AccidentDate,
                'time', AccidentTime,
                'chem', AccidentChemicals,
                'deaths', CAST(deaths AS INT),
                'inj', CAST(inj AS INT),
                'ev_shlt', CAST(ev_shlt AS INT),
                'damg', CAST(damg AS INT)
            )
        ) AS accidents
    FROM
        Accidents
    GROUP BY EPAFacilityID
)

SELECT
    fac.*,
    sub.names_all,
    sub.submissions,
    acc.accidents
FROM
    FacilitiesMeta fac
    LEFT JOIN
        FacilitySubmissions sub
        ON sub.EPAFacilityID = fac.EPAFacilityID
    LEFT JOIN
        FacilityAccidents acc
        ON acc.EPAFacilityID = fac.EPAFacilityID
;
