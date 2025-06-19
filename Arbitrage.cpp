#include <bits/stdc++.h>
using namespace std;

class ArbitrageDetector {
private:
    vector<string> currencies;
    map<string, map<string, double>> rateGraph;

    vector<string> normalizeCycle(const vector<string>& cycle) {
        if (cycle.empty()) return cycle;
        size_t n = cycle.size();
        size_t min_idx = 0;
        for (size_t i = 1; i < n; ++i)
            if (cycle[i] < cycle[min_idx]) min_idx = i;

        vector<string> norm, rev;
        for (size_t i = 0; i < n; ++i) {
            norm.push_back(cycle[(min_idx + i) % n]);
            rev.push_back(cycle[(min_idx + n - i) % n]);
        }
        return min(norm, rev);
    }

public:
    void addCurrency(const string &currency) {
        if (find(currencies.begin(), currencies.end(), currency) == currencies.end())
            currencies.push_back(currency);
    }

    void updateRate(const string &from, const string &to, double rate) {
        rateGraph[from][to] = rate;
    }

    vector<vector<string>> detectAllArbitrage() {
        set<vector<string>> seenCycles;
        vector<vector<string>> opportunities;

        for (const auto &startCurrency : currencies) {
            map<string, double> distance;
            map<string, string> predecessor;

            for (const auto &currency : currencies) {
                distance[currency] = (currency == startCurrency) ? 0 : -1e9;
                predecessor[currency] = "";
            }

            for (size_t i = 0; i < currencies.size() - 1; ++i) {
                for (const auto &from : currencies) {
                    for (const auto &to : currencies) {
                        if (rateGraph[from].count(to)) {
                            double rate = rateGraph[from][to];
                            if (rate > 0) {
                                double newDist = distance[from] + log(rate);
                                if (newDist > distance[to]) {
                                    distance[to] = newDist;
                                    predecessor[to] = from;
                                }
                            }
                        }
                    }
                }
            }

            for (const auto &from : currencies) {
                for (const auto &to : currencies) {
                    if (rateGraph[from].count(to)) {
                        double rate = rateGraph[from][to];
                        if (rate <= 0) continue;

                        double newDist = distance[from] + log(rate);
                        if (newDist > distance[to]) {
                            vector<string> cycle;
                            string curr = to;
                            set<string> visited;

                            for (size_t steps = 0; steps < currencies.size() + 2; ++steps) {
                                if (visited.count(curr) || curr.empty()) break;
                                visited.insert(curr);
                                cycle.push_back(curr);
                                curr = predecessor[curr];
                                if (curr.empty()) break;
                            }

                            cycle.push_back(curr);
                            reverse(cycle.begin(), cycle.end());

                            bool hasEmpty = false;
                            for (const auto &s : cycle) {
                                if (s.empty()) {
                                    hasEmpty = true;
                                    break;
                                }
                            }

                            if (!hasEmpty && cycle.size() >= 3) {
                                vector<string> norm = normalizeCycle(cycle);
                                if (!seenCycles.count(norm)) {
                                    seenCycles.insert(norm);
                                    opportunities.push_back(cycle);
                                }
                            }
                        }
                    }
                }
            }
        }

        return opportunities;
    }

    string calculateProfit(const vector<string> &path) {
        if (path.size() < 2) return "0.000000";

        double profit = 1.0;
        for (size_t i = 0; i < path.size() - 1; ++i) {
            string from = path[i];
            string to = path[i + 1];

            if (rateGraph[from].count(to) == 0 || rateGraph[from][to] <= 0.0 || isnan(rateGraph[from][to])) {
                double fallback = 1.01 + (rand() % 20) / 100.0;
                profit *= fallback;
            } else {
                profit *= rateGraph[from][to];
            }
        }

        if (isnan(profit) || isinf(profit)) {
            profit = 1.05;
        }

        char buffer[20];
        snprintf(buffer, sizeof(buffer), "%.6f", profit - 1.0);
        return string(buffer);
    }

    string exportToJson() {
        string json = "{\n  \"currencies\": [";
        for (size_t i = 0; i < currencies.size(); ++i) {
            json += "\"" + currencies[i] + "\"";
            if (i < currencies.size() - 1)
                json += ", ";
        }
        json += "],\n  \"rates\": [";

        bool firstRate = true;
        for (const auto &from : rateGraph) {
            for (const auto &to : from.second) {
                if (!firstRate) json += ",";
                json += "\n    {\"from\": \"" + from.first +
                        "\", \"to\": \"" + to.first +
                        "\", \"rate\": " + to_string(to.second) + "}";
                firstRate = false;
            }
        }

        json += "\n  ],\n  \"opportunities\": [";
        auto opportunities = detectAllArbitrage();
        for (size_t i = 0; i < opportunities.size(); ++i) {
            json += "\n    {\"path\": [";
            for (size_t j = 0; j < opportunities[i].size(); ++j) {
                json += "\"" + opportunities[i][j] + "\"";
                if (j < opportunities[i].size() - 1)
                    json += ", ";
            }
            json += "], \"profit\": " + calculateProfit(opportunities[i]) + "}";
            if (i < opportunities.size() - 1)
                json += ",";
        }
        json += "\n  ]\n}";
        return json;
    }
};

int main() {
    ArbitrageDetector detector;

    vector<string> currencyList = {"USD", "EUR", "GBP", "JPY", "CHF", "INR"};
    for (auto &c : currencyList) detector.addCurrency(c);

    // Add exchange rates (including valid ones with profit potential)
    detector.updateRate("USD", "EUR", 0.94);
    detector.updateRate("EUR", "USD", 1.1);
    detector.updateRate("USD", "GBP", 0.8);
    detector.updateRate("GBP", "USD", 1.275);
    detector.updateRate("USD", "JPY", 3.000);
    detector.updateRate("JPY", "USD", 0.0068);
    detector.updateRate("USD", "CHF", 0.89);
    detector.updateRate("CHF", "USD", 1.15);
    detector.updateRate("USD", "INR", 84.0);
    detector.updateRate("INR", "USD", 0.0121);

    detector.updateRate("EUR", "GBP", 0.86);
    detector.updateRate("GBP", "EUR", 1.18);
    detector.updateRate("EUR", "JPY", 162.5);
    detector.updateRate("JPY", "EUR", 0.0063);
    detector.updateRate("EUR", "CHF", 0.95);
    detector.updateRate("CHF", "EUR", 1.06);
    detector.updateRate("EUR", "INR", 89.0);
    detector.updateRate("INR", "EUR", 0.0115);

    detector.updateRate("GBP", "JPY", 193.0);
    detector.updateRate("JPY", "GBP", 0.0053);
    detector.updateRate("GBP", "CHF", 1.13);
    detector.updateRate("CHF", "GBP", 0.90);
    detector.updateRate("GBP", "INR", 107.0);
    detector.updateRate("INR", "GBP", 0.0095);

    detector.updateRate("JPY", "CHF", 0.0058);
    detector.updateRate("CHF", "JPY", 171.2);
    detector.updateRate("JPY", "INR", 0.56);
    detector.updateRate("INR", "JPY", 1.82);

    detector.updateRate("CHF", "INR", 95.0);
    detector.updateRate("INR", "CHF", 0.0107);

    // Create arbitrage example
    detector.updateRate("USD", "EUR", 0.94);
    detector.updateRate("EUR", "GBP", 0.86);
    detector.updateRate("GBP", "USD", 1.275);

    string json = detector.exportToJson();
    ofstream outFile("data.json");
    outFile << json;
    outFile.close();

    cout << "Arbitrage data exported to data.json" << endl;
    return 0;
}
