// ─────────────────────────────────────────────────────────────────────────────
// FORMPrivateMemberApp.swift
// FORM Private — Member-facing surface
// Drop → Respond → Gate
//
// Doctrine: Signal → Confirm → Orient → Disappear.
// The member experience is four things only.
// Nothing else. No feed. No profiles. No chat.
//
// This file is the member surface only.
// Companion to FORMPrivateApp.swift (curator dashboard).
// Cursor will split both into their final structure.
//
// Design language: dark hero screens, warm cream respond,
// charcoal gate. Georgia serif. Minimal. Intentional.
// ─────────────────────────────────────────────────────────────────────────────

import SwiftUI

// ─────────────────────────────────────────────────────────────────────────────
// MARK: - Member App Entry (for standalone preview / testing)
// In production this becomes a separate scheme or target
// ─────────────────────────────────────────────────────────────────────────────

struct MemberRootView: View {
    @StateObject private var session = MemberSession()

    var body: some View {
        Group {
            if let drop = session.activeDrop {
                switch session.memberState {
                case .viewing:
                    MemberDropView(drop: drop)
                        .environmentObject(session)
                case .responding:
                    MemberRespondView(drop: drop)
                        .environmentObject(session)
                case .confirmed:
                    MemberGateView(drop: drop)
                        .environmentObject(session)
                case .declined:
                    MemberDeclinedView(drop: drop)
                        .environmentObject(session)
                }
            } else {
                MemberQuietView()
            }
        }
        .animation(.easeInOut(duration: 0.3), value: session.memberState)
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// MARK: - Member Session (State Machine)
// ─────────────────────────────────────────────────────────────────────────────

final class MemberSession: ObservableObject {
    enum State { case viewing, responding, confirmed, declined }

    @Published var memberState: State = .viewing
    @Published var plusOneName: String = ""
    @Published var depositSent: Bool = false

    // In production this comes from DropStore via shared container or CloudKit
    // For now seeded with sample data
    var activeDrop: MemberDrop? = MemberDrop.sample

    var currentMember: MemberIdentity = MemberIdentity.sample

    func beginRespond() { memberState = .responding }
    func confirm()      { memberState = .confirmed }
    func decline()      { memberState = .declined }
    func reset()        { memberState = .viewing; plusOneName = ""; depositSent = false }
}

// ─────────────────────────────────────────────────────────────────────────────
// MARK: - Member-facing Models
// Lightweight mirrors of curator models — members see less
// ─────────────────────────────────────────────────────────────────────────────

struct MemberDrop {
    var id          : UUID = UUID()
    var title       : String
    var occasion    : String       // the vibe — why this exists beyond the people
    var dateLabel   : String       // "Sunday, June 15"
    var timeWindow  : String       // "5 – 9 pm"
    var location    : String
    var costType    : CostKind
    var costLabel   : String       // "$55 fixed" or "No cost" etc
    var depositLabel: String?      // "$20 at RSVP" — only Class A
    var rsvpDeadlineLabel: String  // "RSVP by Thursday"
    var spotsLeft   : Int?         // nil = no cap shown
    var classType   : DropKind
    var circleWhoGoing: [CircleMember] // village members attending — no strangers
    var isClassA    : Bool { classType == .a }

    enum CostKind { case free, estimate, fixed }
    enum DropKind  { case a, b }

    static let sample = MemberDrop(
        title: "Sunday at the River",
        occasion: "Afternoon into evening. Music. Good company.",
        dateLabel: "Sunday, June 15",
        timeWindow: "5 – 9 pm",
        location: "Casa Neos Beach House · Miami River",
        costType: .fixed,
        costLabel: "$55 fixed contribution",
        depositLabel: "$20 at RSVP — credited to your total",
        rsvpDeadlineLabel: "RSVP by Thursday",
        spotsLeft: 8,
        classType: .a,
        circleWhoGoing: CircleMember.sampleCircle
    )
}

struct MemberIdentity {
    var firstName : String
    var lastName  : String
    var initials  : String { "\(firstName.prefix(1))\(lastName.prefix(1))" }

    static let sample = MemberIdentity(firstName: "Brice", lastName: "I.")
}

struct CircleMember: Identifiable {
    var id        = UUID()
    var firstName : String
    var lastName  : String
    var initials  : String { "\(firstName.prefix(1))\(lastName.prefix(1))" }

    static let sampleCircle: [CircleMember] = [
        .init(firstName: "Marcus",  lastName: "B."),
        .init(firstName: "Lara",    lastName: "F."),
        .init(firstName: "Chloe",   lastName: "B."),
        .init(firstName: "Andrea",  lastName: "A."),
        .init(firstName: "Paola",   lastName: "D."),
    ]
}

// ─────────────────────────────────────────────────────────────────────────────
// MARK: - Design Tokens (member surface — dark-first)
// ─────────────────────────────────────────────────────────────────────────────

private enum MC {
    // Dark hero palette
    static let dark         = Color(hex: "#0D0B09")
    static let darkMid      = Color(hex: "#1A1710")
    static let heroOverlay1 = Color.black.opacity(0.25)
    static let heroOverlay2 = Color.black.opacity(0.88)
    static let heroText     = Color(hex: "#F5F2EC")
    static let heroMuted    = Color(hex: "#F5F2EC").opacity(0.45)
    static let heroDim      = Color(hex: "#F5F2EC").opacity(0.25)

    // Warm card palette (respond screen)
    static let cream        = Color(hex: "#F0EDE6")
    static let surface      = Color(hex: "#FAFAF7")
    static let white        = Color.white
    static let ink          = Color(hex: "#1A1710")
    static let ink2         = Color(hex: "#2E2A22")
    static let muted        = Color(hex: "#6B6358")
    static let dim          = Color(hex: "#9E978C")
    static let line         = Color(hex: "#DDD9D0")

    // Gate
    static let gateGreen    = Color(hex: "#2D6645")
    static let gateGreenBg  = Color(hex: "#EBF4EE")
}

private extension Color {
    init(hex: String) {
        let h = hex.trimmingCharacters(in: CharacterSet(charactersIn: "#"))
        var rgb: UInt64 = 0
        Scanner(string: h).scanHexInt64(&rgb)
        self.init(
            red:   Double((rgb >> 16) & 0xFF) / 255,
            green: Double((rgb >>  8) & 0xFF) / 255,
            blue:  Double( rgb        & 0xFF) / 255
        )
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// MARK: - Screen 1: Drop (Signal)
// Dark, full-bleed, atmospheric. Card rises from bottom.
// ─────────────────────────────────────────────────────────────────────────────

struct MemberDropView: View {
    let drop: MemberDrop
    @EnvironmentObject var session: MemberSession
    @State private var cardAppeared = false

    var body: some View {
        ZStack(alignment: .bottom) {

            // Background — dark gradient simulating photo hero
            // In production: AsyncImage from drop.heroImageURL
            heroBackground

            // Top nav bar
            VStack {
                HStack {
                    Spacer()
                    VStack(spacing: 2) {
                        Text("FORM")
                            .font(.custom("Georgia", size: 14))
                            .tracking(4)
                            .foregroundColor(MC.heroText)
                        Text("PRIVATE")
                            .font(.system(size: 8, weight: .semibold))
                            .tracking(5)
                            .foregroundColor(MC.heroDim)
                    }
                    Spacer()
                }
                .padding(.top, 56)
                .padding(.horizontal, 24)

                // DROP label
                Text("DROP")
                    .font(.system(size: 9.5, weight: .semibold))
                    .tracking(5)
                    .foregroundColor(MC.heroDim)
                    .padding(.top, 8)

                Spacer()
            }

            // Rising card
            VStack(spacing: 0) {
                dropCard
            }
            .offset(y: cardAppeared ? 0 : 120)
            .opacity(cardAppeared ? 1 : 0)
        }
        .ignoresSafeArea()
        .background(MC.dark)
        .onAppear {
            withAnimation(.spring(response: 0.55, dampingFraction: 0.82).delay(0.15)) {
                cardAppeared = true
            }
        }
    }

    private var heroBackground: some View {
        ZStack {
            // Simulated ambient gradient — replace with actual venue image
            LinearGradient(
                colors: [
                    Color(hex: "#1A1208"),
                    Color(hex: "#0D0B09"),
                    Color(hex: "#0A0908"),
                ],
                startPoint: .top,
                endPoint: .bottom
            )

            // Texture overlay
            LinearGradient(
                colors: [
                    Color.clear,
                    MC.dark.opacity(0.6),
                    MC.dark.opacity(0.92),
                ],
                startPoint: UnitPoint(x: 0.5, y: 0.25),
                endPoint: .bottom
            )
        }
        .ignoresSafeArea()
    }

    private var dropCard: some View {
        VStack(spacing: 0) {
            // Card inner
            VStack(spacing: 0) {
                // Eyebrow — date
                Text(drop.dateLabel.uppercased())
                    .font(.system(size: 11, weight: .semibold))
                    .tracking(1.5)
                    .foregroundColor(MC.dim)
                    .padding(.top, 24)
                    .padding(.bottom, 4)

                // Occasion — the vibe line
                Text(drop.occasion)
                    .font(.custom("Georgia", size: 13).italic())
                    .foregroundColor(MC.muted)
                    .multilineTextAlignment(.center)
                    .lineSpacing(3)
                    .padding(.horizontal, 26)
                    .padding(.bottom, 10)

                // Time
                Text(drop.timeWindow)
                    .font(.system(size: 14.5, weight: .medium))
                    .foregroundColor(MC.ink2)

                // Location
                Text(drop.location)
                    .font(.system(size: 13))
                    .foregroundColor(MC.dim)
                    .padding(.top, 2)
                    .padding(.bottom, 16)

                // Divider
                Rectangle().fill(MC.line).frame(height: 1)

                // Who's going — your circle
                if !drop.circleWhoGoing.isEmpty {
                    VStack(spacing: 10) {
                        HStack(spacing: 0) {
                            // Stacked avatars
                            ForEach(drop.circleWhoGoing.prefix(5)) { person in
                                CircleAvatar(initials: person.initials, size: 28)
                                    .offset(x: CGFloat(drop.circleWhoGoing.prefix(5).firstIndex(where: { $0.id == person.id }) ?? 0) * -6)
                            }
                        }
                        .padding(.leading, CGFloat(min(drop.circleWhoGoing.count, 5) - 1) * 3)

                        Text("\(drop.circleWhoGoing.map { $0.firstName }.prefix(3).joined(separator: ", "))\(drop.circleWhoGoing.count > 3 ? " + \(drop.circleWhoGoing.count - 3) more" : "") are in")
                            .font(.system(size: 12.5))
                            .foregroundColor(MC.muted)
                    }
                    .padding(.vertical, 14)
                    .padding(.horizontal, 26)

                    Rectangle().fill(MC.line).frame(height: 1)
                }

                // Invite text
                Text("Respond below.")
                    .font(.custom("Georgia", size: 13).italic())
                    .foregroundColor(MC.muted)
                    .padding(.vertical, 13)

            }
            .background(MC.surface)

            // CTA button — full width, dark
            Button {
                withAnimation(.easeInOut(duration: 0.2)) {
                    session.beginRespond()
                }
            } label: {
                Text("RESPOND")
                    .font(.system(size: 10.5, weight: .semibold))
                    .tracking(3.5)
                    .foregroundColor(MC.heroText)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 20)
                    .background(MC.darkMid)
            }
        }
        .clipShape(RoundedRectangle(cornerRadius: 22, style: .continuous)
            .corner(.topLeft, radius: 22)
            .corner(.topRight, radius: 22)
            .corner(.bottomLeft, radius: 0)
            .corner(.bottomRight, radius: 0))
        .shadow(color: .black.opacity(0.45), radius: 40, x: 0, y: -8)
    }
}

// Helper for top-only rounded corners
extension RoundedRectangle {
    func corner(_ corner: UIRectCorner, radius: CGFloat) -> some Shape {
        self
    }
}

// Top-rounded card shape
struct TopRoundedShape: Shape {
    var radius: CGFloat
    func path(in rect: CGRect) -> Path {
        let path = UIBezierPath(
            roundedRect: rect,
            byRoundingCorners: [.topLeft, .topRight],
            cornerRadii: CGSize(width: radius, height: radius)
        )
        return Path(path.cgPath)
    }
}

struct CircleAvatar: View {
    let initials : String
    let size     : CGFloat

    var body: some View {
        ZStack {
            Circle()
                .fill(Color(hex: "#E8E4DB"))
            Text(initials)
                .font(.system(size: size * 0.34, weight: .semibold))
                .foregroundColor(Color(hex: "#6B6358"))
        }
        .frame(width: size, height: size)
        .overlay(Circle().stroke(MC.surface, lineWidth: 2))
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// MARK: - Screen 2: Respond (Confirm)
// Warm cream. Event summary. Binary choice. No maybes.
// ─────────────────────────────────────────────────────────────────────────────

struct MemberRespondView: View {
    let drop: MemberDrop
    @EnvironmentObject var session: MemberSession

    @State private var choice: Choice? = .inConfirmed
    @State private var plusOneName = ""
    @State private var showPlusOne = false
    @State private var appeared = false

    enum Choice { case inConfirmed, out }

    var body: some View {
        ZStack {
            MC.cream.ignoresSafeArea()

            VStack(spacing: 0) {

                // Back
                HStack {
                    Button {
                        session.reset()
                    } label: {
                        HStack(spacing: 6) {
                            Image(systemName: "chevron.left")
                                .font(.system(size: 13, weight: .semibold))
                            Text("Back")
                                .font(.system(size: 13))
                        }
                        .foregroundColor(MC.muted)
                    }
                    .buttonStyle(.plain)
                    Spacer()
                }
                .padding(.top, 56)
                .padding(.horizontal, 22)
                .padding(.bottom, 14)

                // Page title
                VStack(alignment: .leading, spacing: 4) {
                    Text(drop.dateLabel)
                        .font(.system(size: 10.5, weight: .semibold))
                        .tracking(1.5)
                        .foregroundColor(MC.dim)
                    Text("Response")
                        .font(.custom("Georgia", size: 26))
                        .foregroundColor(MC.ink)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.horizontal, 22)
                .padding(.bottom, 16)

                ScrollView(showsIndicators: false) {
                    VStack(spacing: 10) {

                        // Event summary card
                        VStack(spacing: 0) {
                            summaryRow(label: "Date",     value: "\(drop.dateLabel) · \(drop.timeWindow)")
                            divider
                            summaryRow(label: "Location", value: drop.location)
                            divider
                            summaryRow(label: "Cost",     value: drop.costLabel)
                            if let deposit = drop.depositLabel {
                                divider
                                summaryRow(label: "Deposit", value: deposit, valueColor: Color(hex: "#7A5E28"))
                            }
                            if let spots = drop.spotsLeft {
                                divider
                                summaryRow(label: "Spots",   value: "\(spots) remaining")
                            }
                        }
                        .background(MC.white)
                        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                        .overlay(RoundedRectangle(cornerRadius: 14, style: .continuous)
                            .stroke(MC.line, lineWidth: 1))

                        // Response options
                        responseOption(
                            label: "I'll be there",
                            sublabel: drop.isClassA ? "Deposit required to confirm" : "RSVP is a commitment",
                            selected: choice == .inConfirmed,
                            action: { choice = .inConfirmed }
                        )

                        responseOption(
                            label: "Not this time",
                            sublabel: "No explanation needed",
                            selected: choice == .out,
                            action: { choice = .out }
                        )

                        // Plus-one (only when in)
                        if choice == .inConfirmed {
                            VStack(alignment: .leading, spacing: 8) {
                                Button {
                                    withAnimation(.easeInOut(duration: 0.2)) {
                                        showPlusOne.toggle()
                                    }
                                } label: {
                                    HStack {
                                        Image(systemName: showPlusOne ? "minus.circle" : "plus.circle")
                                            .foregroundColor(MC.dim)
                                        Text(showPlusOne ? "Remove guest" : "Bring a guest")
                                            .font(.system(size: 14))
                                            .foregroundColor(MC.muted)
                                    }
                                }
                                .buttonStyle(.plain)

                                if showPlusOne {
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text("Guest name")
                                            .font(.system(size: 11, weight: .semibold))
                                            .tracking(1)
                                            .foregroundColor(MC.dim)
                                        TextField("First and last name", text: $plusOneName)
                                            .font(.system(size: 15))
                                            .foregroundColor(MC.ink)
                                            .padding(12)
                                            .background(MC.white)
                                            .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
                                            .overlay(
                                                RoundedRectangle(cornerRadius: 8, style: .continuous)
                                                    .stroke(MC.line, lineWidth: 1)
                                            )
                                        Text("Guest name is required before confirmation.")
                                            .font(.system(size: 11))
                                            .foregroundColor(MC.dim)
                                    }
                                    .transition(.opacity.combined(with: .move(edge: .top)))
                                }
                            }
                            .padding(.horizontal, 4)
                        }

                        // Deposit note for Class A
                        if choice == .inConfirmed && drop.isClassA {
                            VStack(alignment: .leading, spacing: 6) {
                                Text("About the deposit")
                                    .font(.system(size: 11, weight: .semibold))
                                    .tracking(1)
                                    .foregroundColor(MC.dim)
                                Text("The deposit secures your spot and is credited toward your total. It is non-refundable inside 48 hours of the gathering — except in genuine emergencies at curator discretion.")
                                    .font(.system(size: 13))
                                    .foregroundColor(MC.muted)
                                    .lineSpacing(3)
                            }
                            .padding(14)
                            .background(Color(hex: "#F5EFDF"))
                            .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                            .overlay(
                                RoundedRectangle(cornerRadius: 10, style: .continuous)
                                    .stroke(Color(hex: "#7A5E28").opacity(0.18), lineWidth: 1)
                            )
                        }

                        // Confirm button
                        Button {
                            session.plusOneName = plusOneName
                            if choice == .inConfirmed {
                                session.confirm()
                            } else {
                                session.decline()
                            }
                        } label: {
                            Text(choice == .inConfirmed ? "CONFIRM" : "DECLINE")
                                .font(.system(size: 10.5, weight: .semibold))
                                .tracking(3)
                                .foregroundColor(MC.heroText)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 18)
                                .background(MC.ink)
                                .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                        }
                        .buttonStyle(.plain)
                        .disabled(showPlusOne && plusOneName.trimmingCharacters(in: .whitespaces).isEmpty)
                        .opacity(showPlusOne && plusOneName.trimmingCharacters(in: .whitespaces).isEmpty ? 0.4 : 1)

                        // Doctrine
                        Text("RSVP means RSVP. Presence matters more than presentation.")
                            .font(.custom("Georgia", size: 12).italic())
                            .foregroundColor(MC.dim)
                            .multilineTextAlignment(.center)
                            .padding(.top, 4)

                        Spacer(minLength: 40)
                    }
                    .padding(.horizontal, 22)
                    .padding(.top, 4)
                }
            }
        }
        .opacity(appeared ? 1 : 0)
        .onAppear {
            withAnimation(.easeOut(duration: 0.25)) {
                appeared = true
            }
        }
    }

    private var divider: some View {
        Rectangle().fill(MC.line).frame(height: 1)
    }

    private func summaryRow(label: String, value: String, valueColor: Color = MC.ink) -> some View {
        HStack(alignment: .top) {
            Text(label)
                .font(.system(size: 11.5))
                .foregroundColor(MC.dim)
                .frame(width: 72, alignment: .leading)
            Text(value)
                .font(.system(size: 13.5, weight: .medium))
                .foregroundColor(valueColor)
                .multilineTextAlignment(.trailing)
                .frame(maxWidth: .infinity, alignment: .trailing)
        }
        .padding(.horizontal, 18)
        .padding(.vertical, 10)
    }

    private func responseOption(label: String, sublabel: String, selected: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text(label)
                        .font(.system(size: 15, weight: .medium))
                        .foregroundColor(selected ? MC.heroText : MC.ink)
                    Text(sublabel)
                        .font(.system(size: 12))
                        .foregroundColor(selected ? MC.heroText.opacity(0.5) : MC.dim)
                }
                Spacer()
                ZStack {
                    Circle()
                        .stroke(selected ? MC.heroText : MC.line, lineWidth: 1.5)
                        .frame(width: 20, height: 20)
                    if selected {
                        Circle()
                            .fill(MC.heroText)
                            .frame(width: 9, height: 9)
                    }
                }
            }
            .padding(.horizontal, 18)
            .padding(.vertical, 15)
            .background(selected ? MC.ink : MC.white)
            .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 14, style: .continuous)
                    .stroke(selected ? MC.ink : MC.line, lineWidth: selected ? 0 : 1.5)
            )
            .animation(.easeInOut(duration: 0.15), value: selected)
        }
        .buttonStyle(.plain)
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// MARK: - Screen 3: Gate (Access / Orient)
// Dark again. Confirmed state. Shows circle who else is going.
// The app's job ends here. Disappear.
// ─────────────────────────────────────────────────────────────────────────────

struct MemberGateView: View {
    let drop: MemberDrop
    @EnvironmentObject var session: MemberSession
    @State private var appeared = false

    var body: some View {
        ZStack {
            MC.dark.ignoresSafeArea()

            // Subtle radial glow
            RadialGradient(
                colors: [Color(hex: "#2D6645").opacity(0.07), Color.clear],
                center: .center,
                startRadius: 0,
                endRadius: 280
            )
            .ignoresSafeArea()

            VStack(spacing: 0) {
                Spacer()

                // Brand
                VStack(spacing: 3) {
                    Text("FORM")
                        .font(.custom("Georgia", size: 13))
                        .tracking(4)
                        .foregroundColor(MC.heroText.opacity(0.22))
                    Text("PRIVATE")
                        .font(.system(size: 8, weight: .semibold))
                        .tracking(5)
                        .foregroundColor(MC.heroText.opacity(0.1))
                }
                .padding(.bottom, 48)

                // Confirmed pill
                HStack(spacing: 7) {
                    Circle()
                        .fill(Color(hex: "#2D6645"))
                        .frame(width: 6, height: 6)
                        .shadow(color: Color(hex: "#2D6645").opacity(0.6), radius: 4)
                    Text("CONFIRMED")
                        .font(.system(size: 9.5, weight: .semibold))
                        .tracking(2.5)
                        .foregroundColor(Color(hex: "#2D6645").opacity(0.75))
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 7)
                .background(Color(hex: "#2D6645").opacity(0.08))
                .clipShape(Capsule())
                .overlay(Capsule().stroke(Color(hex: "#2D6645").opacity(0.2), lineWidth: 1))
                .padding(.bottom, 20)

                // Event name — the big serif moment
                Text(drop.title)
                    .font(.custom("Georgia", size: 34))
                    .foregroundColor(MC.heroText)
                    .multilineTextAlignment(.center)
                    .lineSpacing(4)
                    .padding(.horizontal, 32)

                // Date + location
                VStack(spacing: 4) {
                    Text("\(drop.dateLabel) · \(drop.timeWindow)")
                        .font(.system(size: 13))
                        .foregroundColor(MC.heroMuted)
                    Text(drop.location)
                        .font(.system(size: 12))
                        .foregroundColor(MC.heroDim)
                }
                .padding(.top, 12)
                .padding(.bottom, 40)

                // Word token — the access signal
                // In production this is a rotating code updated by curator
                VStack(spacing: 8) {
                    Text("YOUR ENTRY")
                        .font(.system(size: 9, weight: .semibold))
                        .tracking(2.5)
                        .foregroundColor(MC.heroDim)

                    Text(session.currentMember.firstName.uppercased())
                        .font(.custom("Georgia", size: 28))
                        .tracking(6)
                        .foregroundColor(MC.heroText)

                    Text("Show this at the door")
                        .font(.system(size: 11))
                        .foregroundColor(MC.heroDim)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 28)
                .background(MC.heroText.opacity(0.04))
                .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                .overlay(
                    RoundedRectangle(cornerRadius: 16, style: .continuous)
                        .stroke(MC.heroText.opacity(0.06), lineWidth: 1)
                )
                .padding(.horizontal, 28)

                // Plus-one note
                if !session.plusOneName.isEmpty {
                    Text("+ \(session.plusOneName)")
                        .font(.system(size: 13))
                        .foregroundColor(MC.heroMuted)
                        .padding(.top, 14)
                }

                Spacer()

                // Who else from your circle
                if !drop.circleWhoGoing.isEmpty {
                    VStack(spacing: 12) {
                        Text("Also going")
                            .font(.system(size: 10.5, weight: .semibold))
                            .tracking(2)
                            .foregroundColor(MC.heroDim)

                        HStack(spacing: -6) {
                            ForEach(drop.circleWhoGoing.prefix(6)) { person in
                                gateAvatar(initials: person.initials)
                            }
                            if drop.circleWhoGoing.count > 6 {
                                ZStack {
                                    Circle()
                                        .fill(MC.heroText.opacity(0.06))
                                        .frame(width: 34, height: 34)
                                    Text("+\(drop.circleWhoGoing.count - 6)")
                                        .font(.system(size: 10, weight: .semibold))
                                        .foregroundColor(MC.heroMuted)
                                }
                                .overlay(Circle().stroke(MC.dark, lineWidth: 2))
                            }
                        }

                        // First names only
                        Text(drop.circleWhoGoing.prefix(3).map { $0.firstName }.joined(separator: " · "))
                            .font(.system(size: 12))
                            .foregroundColor(MC.heroDim)
                    }
                    .padding(.bottom, 32)
                }

                // Doctrine close
                Text("The village is where you're going. The rest will happen.")
                    .font(.custom("Georgia", size: 13).italic())
                    .foregroundColor(MC.heroDim)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 40)
                    .padding(.bottom, 48)
            }
        }
        .opacity(appeared ? 1 : 0)
        .scaleEffect(appeared ? 1 : 0.97)
        .onAppear {
            withAnimation(.spring(response: 0.5, dampingFraction: 0.85).delay(0.1)) {
                appeared = true
            }
        }
    }

    private func gateAvatar(initials: String) -> some View {
        ZStack {
            Circle()
                .fill(MC.heroText.opacity(0.08))
            Text(initials)
                .font(.system(size: 11, weight: .semibold))
                .foregroundColor(MC.heroMuted)
        }
        .frame(width: 34, height: 34)
        .overlay(Circle().stroke(MC.dark, lineWidth: 2))
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// MARK: - Screen 4: Declined
// Quiet. Warm. No pressure. The door stays open.
// ─────────────────────────────────────────────────────────────────────────────

struct MemberDeclinedView: View {
    let drop: MemberDrop
    @EnvironmentObject var session: MemberSession
    @State private var appeared = false

    var body: some View {
        ZStack {
            MC.cream.ignoresSafeArea()

            VStack(spacing: 0) {
                Spacer()

                VStack(spacing: FPS.md) {
                    Text("Not this time.")
                        .font(.custom("Georgia", size: 26))
                        .foregroundColor(MC.ink)

                    Text("The village will be there.\nYou'll be at the next one.")
                        .font(.system(size: 15))
                        .foregroundColor(MC.muted)
                        .multilineTextAlignment(.center)
                        .lineSpacing(4)
                }
                .padding(.horizontal, 40)

                Spacer()

                // Back option — subtle
                Button {
                    session.reset()
                } label: {
                    Text("View drop again")
                        .font(.system(size: 14))
                        .foregroundColor(MC.dim)
                }
                .buttonStyle(.plain)
                .padding(.bottom, 60)
            }
        }
        .opacity(appeared ? 1 : 0)
        .onAppear {
            withAnimation(.easeOut(duration: 0.3)) { appeared = true }
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// MARK: - Quiet State (no active drop)
// ─────────────────────────────────────────────────────────────────────────────

struct MemberQuietView: View {
    @State private var appeared = false

    var body: some View {
        ZStack {
            Color(hex: "#0D0B09").ignoresSafeArea()

            VStack(spacing: 0) {
                Spacer()

                VStack(spacing: 16) {
                    VStack(spacing: 3) {
                        Text("FORM")
                            .font(.custom("Georgia", size: 14))
                            .tracking(5)
                            .foregroundColor(Color(hex: "#F5F2EC").opacity(0.22))
                        Text("PRIVATE")
                            .font(.system(size: 8, weight: .semibold))
                            .tracking(5)
                            .foregroundColor(Color(hex: "#F5F2EC").opacity(0.1))
                    }

                    Text("The village is quiet.")
                        .font(.custom("Georgia", size: 22))
                        .foregroundColor(Color(hex: "#F5F2EC").opacity(0.35))

                    Text("You'll be notified when the next\ngathering is called.")
                        .font(.system(size: 14))
                        .foregroundColor(Color(hex: "#F5F2EC").opacity(0.18))
                        .multilineTextAlignment(.center)
                        .lineSpacing(4)
                }

                Spacer()
            }
        }
        .opacity(appeared ? 1 : 0)
        .onAppear {
            withAnimation(.easeOut(duration: 0.5)) { appeared = true }
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// MARK: - Spacing (shared reference — mirrors FORMPrivateApp.swift)
// ─────────────────────────────────────────────────────────────────────────────

private enum FPS {
    static let xs: CGFloat  =  4
    static let sm: CGFloat  =  8
    static let md: CGFloat  = 16
    static let lg: CGFloat  = 24
    static let xl: CGFloat  = 32
    static let xxl: CGFloat = 48
    static let screenH: CGFloat = 20
    static let screenB: CGFloat = 40
}

// ─────────────────────────────────────────────────────────────────────────────
// MARK: - Preview
// ─────────────────────────────────────────────────────────────────────────────

#Preview("Drop — Signal") {
    MemberDropView(drop: MemberDrop.sample)
        .environmentObject(MemberSession())
}

#Preview("Respond — Confirm") {
    MemberRespondView(drop: MemberDrop.sample)
        .environmentObject(MemberSession())
}

#Preview("Gate — Access") {
    MemberGateView(drop: MemberDrop.sample)
        .environmentObject({
            let s = MemberSession()
            s.memberState = .confirmed
            return s
        }())
}

#Preview("Quiet — No Drop") {
    MemberQuietView()
}

#Preview("Full Flow") {
    MemberRootView()
}
