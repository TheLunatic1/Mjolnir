use rand::Rng;
use regex::Regex;
use std::time::{SystemTime, UNIX_EPOCH};
use uuid::Uuid;

pub struct FakerGenerator;

impl FakerGenerator {
    pub fn replace_tokens(input: &str) -> String {
        let mut result = input.to_string();

        if result.contains("{{faker.uuid}}") {
            result = result.replace("{{faker.uuid}}", &Uuid::new_v4().to_string());
        }
        if result.contains("{{faker.timestamp}}") {
            let ts = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs();
            result = result.replace("{{faker.timestamp}}", &ts.to_string());
        }
        if result.contains("{{faker.email}}") {
            let mut rng = rand::thread_rng();
            let id: u32 = rng.gen_range(1000..999999);
            result = result.replace("{{faker.email}}", &format!("user_{}@mjolnir-test.enterprise", id));
        }
        if result.contains("{{faker.name}}") {
            let names = ["Thor Odinson", "Jane Foster", "Loki Laufeyson", "Heimdall", "Valkyrie", "Odin Allfather"];
            let mut rng = rand::thread_rng();
            let name = names[rng.gen_range(0..names.len())];
            result = result.replace("{{faker.name}}", name);
        }
        if let Ok(re) = Regex::new(r"\{\{faker\.randomInt\((\d+),\s*(\d+)\)\}\}") {
            result = re.replace_all(&result, |caps: &regex::Captures| {
                let min: i64 = caps[1].parse().unwrap_or(0);
                let max: i64 = caps[2].parse().unwrap_or(100);
                let mut rng = rand::thread_rng();
                rng.gen_range(min..=max).to_string()
            }).to_string();
        }

        result
    }
}
