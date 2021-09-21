const expect = require("expect.js");
const fixtures = require("./fixtures");

function test(what, t, comment = "") {
    describe(what + " " + comment, () => {
        it("index", t(require("../")[what]));
        it("direct", t(require("../cjs/" + what)));
    });
}

describe("single", () => {
    test("jsToXliff12", (fn) => (done) => {
        fn(fixtures.example_reworked.js, (err, res) => {
            expect(err).not.to.be.ok();
            expect(res).to.eql(fixtures.example_reworked.xliff12);
            done();
        });
    });

    test(
        "jsToXliff12",
        (fn) => (done) => {
            fn(fixtures.example.js, { indent: false }, (err, res) => {
                expect(err).not.to.be.ok();
                expect(res).to.eql(fixtures.example.xliff12_compact);
                done();
            });
        },
        "with {indent: false}"
    );
});
